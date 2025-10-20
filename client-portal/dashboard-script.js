const API_BASE = "http://localhost:8000/api/v1";
const WIDGET_URL = "http://localhost:8000/static/chatbot-widget.html";
const ACCESS_TOKEN = localStorage.getItem("access_token");
const CLIENT_TOKEN = localStorage.getItem("client_token");
const statusDiv = document.getElementById("upload-status");
const iframeDisplay = document.getElementById("iframe-code-display");
const historySection = document.getElementById('history-list');

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

  // Status de Processando (Início da chamada assíncrona)
  showStatus("Documento recebido. Indexação em segundo plano. Recarregue a página em alguns instantes para ver o status.", "loading");

  try {
    const response = await fetch(`${API_BASE}/documents/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
      body: formData,
    });
    
    const result = await response.json();

    if (response.status === 202) { // 202 Accepted - Assíncrono
        // Feedback de sucesso, instrui o cliente a recarregar.
        showStatus(`Sucesso! Processamento iniciado (ID: ${result.client_id}). Status aparecerá no histórico.`, "success");
        fileInput.value = ""; // Limpa o input
        
        
    } else {
        const errorDetail = result.detail || "Falha no servidor. Tente novamente.";
        showStatus(`Erro: ${errorDetail}`, "error");
    }
    
  } catch (error) {
    console.error("Erro no upload:", error);
    showStatus("Erro de rede. Verifique se o servidor FastAPI e o Redis Worker estão ativos.", "error");
  }
});


// --- 4. Lógica de Histórico de Documentos  ---

async function fetchHistory() {
    historySection.innerHTML = '<p class="loading-state">Carregando histórico...</p>';
    
    try {
        const response = await fetch(`${API_BASE}/documents`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
        });
        
        const documents = await response.json();
        const docCountDisplay = document.getElementById('doc-count');
        
        historySection.innerHTML = ''; // Limpa o carregamento

        if (documents.length === 0) {
            historySection.innerHTML = '<p class="loading-state">Nenhum documento finalizado ainda. Faça seu primeiro upload!</p>';
            docCountDisplay.textContent = '0';
            return;
        }
        
        docCountDisplay.textContent = documents.length;

        const listHtml = documents.map(doc => {
            const date = new Date(doc.uploaded_at).toLocaleDateString('pt-BR');
            const statusLower = doc.status.toLowerCase();
            let statusText;
            
            // Mapeamento de status para exibição
            if (statusLower === 'completed') {
                statusText = 'CONCLUÍDO';
            } else {
                statusText = 'FALHOU'; 
            }
            
            const downloadLink = doc.status === 'COMPLETED' 
                ? `<a href="${API_BASE}/documents/download/${doc.id}" target="_blank" class="download-link">Visualizar</a>` 
                : '<span>-</span>';

            return `
                <li class="history-item status-${statusLower}">
                    <span class="filename">${doc.filename}</span>
                    <span class="date">${date}</span>
                    <span class="status ${statusLower}">${statusText}</span>
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

// File input visual feedback
document.getElementById("file-upload").addEventListener("change", (e) => {
  const fileName = e.target.files[0]?.name
  if (fileName) {
    const label = document.querySelector(".file-upload-text")
    label.textContent = `Arquivo selecionado: ${fileName}`
  }
})