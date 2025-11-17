const API_BASE = "http://localhost:8000/api/v1";
const WIDGET_URL = "http://localhost:8000/static/chatbot-widget.html";
const ACCESS_TOKEN = localStorage.getItem("access_token");
const CLIENT_TOKEN = localStorage.getItem("client_token");
const statusDiv = document.getElementById("upload-status");
const iframeDisplay = document.getElementById("iframe-code-display");
const historySection = document.getElementById('history-list');

let pollingInterval = null; 
const POLLING_RATE_MS = 8000; 


if (!ACCESS_TOKEN || !CLIENT_TOKEN) {
  window.location.href = "login.html"; 
}

document.addEventListener('DOMContentLoaded', () => {
    iframeDisplay.textContent = generateIframeCode(CLIENT_TOKEN);
    fetchHistory(); 
});


function generateIframeCode(token) {
  return `<div style="position: fixed; bottom: 20px; right: 20px; width: 380px; height: 500px; z-index: 9999; box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2); border-radius: 15px; overflow: hidden;">
    <iframe src="${WIDGET_URL}?token=${token}" width="100%" height="100%" frameborder="0" title="Chatbot RAG"></iframe>
</div>`;
}

function copyIframeCode() {
  navigator.clipboard
    .writeText(iframeDisplay.textContent)
    .then(() => {
      const copyBtn = document.querySelector(".copy-btn");
      const originalText = copyBtn.innerHTML;
      copyBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>
                Copiado!
            `;
      copyBtn.style.background = "#28a745"; 
      copyBtn.style.borderColor = "#218838";

      setTimeout(() => {
        copyBtn.innerHTML = originalText;
        copyBtn.style.background = ""; 
        copyBtn.style.borderColor = "";
      }, 2000);
    })
    .catch((err) => {
      console.error("Falha ao copiar:", err);
      alert("Erro ao copiar código. Tente manualmente.");
    });
}

function logout() {
  localStorage.clear();
  window.location.href = "login.html";
}

function showStatus(message, type) {
  statusDiv.textContent = message;
  statusDiv.className = `upload-status ${type}`;
}


function startStatusPolling(docId) {
    if (pollingInterval) {
        clearInterval(pollingInterval);
    }

    pollingInterval = setInterval(() => {
        checkDocumentStatus(docId);
    }, POLLING_RATE_MS);
}

function stopStatusPolling() {
    if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
    }
}

async function checkDocumentStatus(docId) {
    try {
        const response = await fetch(`${API_BASE}/documents`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
        });

        if (!response.ok) {
            stopStatusPolling();
            throw new Error(`Erro ${response.status} ao buscar status.`);
        }
        
        const documents = await response.json();
        const targetDoc = documents.find(doc => doc.id === docId);

        if (targetDoc) {
            const statusLower = targetDoc.status.toLowerCase();

            if (statusLower === 'concluído' || statusLower === 'falhou') {
                stopStatusPolling();
                fetchHistory();
                return;
            }
        } else {
            // Se o documento não for encontrado após um tempo, pode ter sido um erro de registro inicial
            console.warn("Documento não encontrado na lista de status. Continuando polling.");
            // Não paramos o polling aqui para o caso de a lista demorar a ser populada
        }

    } catch (error) {
        console.error("Erro no polling:", error);
        stopStatusPolling();
        showStatus("Erro de rede durante a verificação de status.", "error");
    }
}


document.getElementById("upload-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const fileInput = document.getElementById("file-upload");
  const file = fileInput.files[0];

  if (!file) {
    showStatus("Por favor, selecione um arquivo PDF.", "error");
    return;
  }
  
  if (file.type !== "application/pdf" || file.size > 10 * 1024 * 1024) {
    showStatus("Validação falhou. Apenas PDF (máx. 10MB) é aceito.", "error");
    return;
  }

  const formData = new FormData();
  formData.append("file", file);

  showStatus("Documento recebido. Indexação em segundo plano...", "loading");

  try {
    const response = await fetch(`${API_BASE}/documents/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
      body: formData,
    });
    
    const result = await response.json();

    if (response.status === 202) { 
        showStatus(`Sucesso! Processamento iniciado. Status será monitorado.`, "success");
        fileInput.value = ""; 
        
        // Inicia o Polling usando o ID do documento.
        // É essencial que o backend retorne o doc_id aqui.
        if (result.doc_id) { 
            startStatusPolling(result.doc_id); 
            setTimeout(fetchHistory, 500); // Atualiza para mostrar PENDENTE/PROCESSANDO
        } else {
             showStatus("Sucesso no envio, mas ID do documento não retornado. Recarregue a página para verificar.", "warning");
        }
        
    } else if (response.status === 401) {
        showStatus("Erro de autenticação. Sessão expirada. Faça o login novamente.", "error");
        setTimeout(logout, 2000);
    } else if (response.status === 400) {
        const errorDetail = result.detail || "Erro de validação.";
        showStatus(`Erro: ${errorDetail}`, "error");
    } else if (response.status === 503) {
        showStatus("Serviço de fila indisponível (Redis/Celery). Tente mais tarde.", "error");
    } else {
        const errorDetail = result.detail || "Falha desconhecida no servidor.";
        showStatus(`Erro: ${errorDetail}`, "error");
    }
    
  } catch (error) {
    console.error("Erro no upload:", error);
    showStatus("Erro de rede. Verifique se o servidor FastAPI e o Redis Worker estão ativos.", "error");
  }
});


async function fetchHistory() {
    historySection.innerHTML = '<p class="loading-state">Carregando histórico...</p>';
    
    try {
        const response = await fetch(`${API_BASE}/documents`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
        });
        
        if (response.status === 401) {
             historySection.innerHTML = '<p class="error-message">Sessão expirada. Recarregue e faça o login novamente.</p>';
             return;
        }
        if (!response.ok) {
            throw new Error(`Erro ${response.status} ao buscar dados.`);
        }
        
        const documents = await response.json();
        const docCountDisplay = document.getElementById('doc-count');
        
        historySection.innerHTML = ''; 

        if (documents.length === 0) {
            historySection.innerHTML = '<p class="loading-state">Nenhum documento finalizado ainda. Faça seu primeiro upload!</p>';
            docCountDisplay.textContent = '0';
            return;
        }
        
        docCountDisplay.textContent = documents.length;

        const listHtml = documents.map(doc => {
            const statusUpper = doc.status.toUpperCase();           
            const date = new Date(doc.uploaded_at).toLocaleDateString('pt-BR');
            let statusText;
            let statusClass;
            
            if (statusUpper === 'CONCLUÍDO') {
                statusText = 'CONCLUÍDO';
                statusClass = 'completed';
            } else if (statusUpper === 'FALHOU') {
                statusText = 'FALHOU';
                statusClass = 'failed';
            } else {
                statusText = 'PROCESSANDO...'; 
                statusClass = 'processing';
            }
            
            const downloadLink = statusUpper === 'CONCLUÍDO' 
                ? `<a href="${API_BASE}/documents/download/${doc.id}" target="_blank" class="download-link">&nbsp Visualizar</a>` 
                : '<span>-</span>';

            return `
                <li class="history-item status-${statusClass}">
                    <span class="filename">${doc.filename}</span>
                    <span class="date">${date}</span>
                    <span class="status ${statusClass}">${statusText}</span>
                    <span class="action">${downloadLink}</span>
                </li>
            `;
        }).join('');

        historySection.innerHTML = `<ul class="document-list">${listHtml}</ul>`;

    } catch (error) {
        console.error('Erro ao buscar histórico:', error);
        historySection.innerHTML = '<p class="error-message">Erro ao carregar o histórico de documentos. Tente recarregar a página.</p>';
    }
}


document.getElementById("file-upload").addEventListener("change", (e) => {
  const fileName = e.target.files[0]?.name
  if (fileName) {
    const label = document.querySelector(".file-upload-text")
    label.textContent = `Arquivo selecionado: ${fileName}`
  }
})