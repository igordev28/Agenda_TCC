document.getElementById('processButton').addEventListener('click', handleFile, false);

function converterHorarioExcel(valor) {
  if (valor === undefined || valor === null) return null;
  if (typeof valor === 'string' && valor.includes(':')) return valor;
  const num = Number(valor);
  if (isNaN(num)) return null;
  const horas = Math.floor(num * 24);
  const minutos = Math.round((num * 24 * 60) % 60);
  return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:00`;
}

function handleFile() {
  const fileInput = document.getElementById('fileInput');
  const file = fileInput.files[0];

  if (!file) {
    alert("Por favor, selecione um arquivo.");
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet);

      const atividades = jsonData.flatMap(item => {
        const datas = item['Datas da atividade (Individual)']
          ? item['Datas da atividade (Individual)'].toString().split(';').map(d => d.trim())
          : [];

        if (datas.length === 0) {
          return [{
            descricao: item.Descrição || '',
            nomePessoalAtribuido: item['Nome do pessoal atribuído'] || '',
            diasAgendados: item['Dias agendados'] || '',
            horaInicioAgendada: converterHorarioExcel(item['Hora de início agendada']),
            fimAgendado: converterHorarioExcel(item['Fim Agendado']),
            datasAtividadeIndividual: '',
            descricaoLocalizacaoAtribuida: item['Descrição da localização atribuída'] || ''
          }];
        }

        return datas.map(data => ({
          descricao: item.Descrição || '',
          nomePessoalAtribuido: item['Nome do pessoal atribuído'] || '',
          diasAgendados: item['Dias agendados'] || '',
          horaInicioAgendada: converterHorarioExcel(item['Hora de início agendada']),
          fimAgendado: converterHorarioExcel(item['Fim Agendado']),
          datasAtividadeIndividual: data,
          descricaoLocalizacaoAtribuida: item['Descrição da localização atribuída'] || ''
        }));
      });

      displayData(atividades);
      sendDataToServer(atividades);
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      alert('Erro ao processar o arquivo: ' + error.message);
    }
  };

  reader.onerror = function() {
    alert('Erro ao ler o arquivo.');
  };

  reader.readAsArrayBuffer(file);
}

function getCategoriaClasse(descricao) {
  const desc = descricao.toLowerCase();
  if (desc.includes('limpeza')) return 'atividade-limpeza';
  if (desc.includes('manutenção')) return 'atividade-manutencao';
  if (desc.includes('reparo')) return 'atividade-reparo';
  if (desc.includes('inspecao') || desc.includes('inspeção')) return 'atividade-inspecao';
  return 'atividade-padrao';
}

function displayData(atividades) {
  const outputDiv = document.getElementById('output');
  outputDiv.innerHTML = '';

  atividades.forEach(atividade => {
    const div = document.createElement('div');
    const classeCategoria = getCategoriaClasse(atividade.descricao);
    div.className = `atividade ${classeCategoria}`;

    div.innerHTML = `
      <div class="atividade-header">
        <h3>${atividade.descricao || 'Sem descrição'}</h3>
        <span>${atividade.datasAtividadeIndividual || 'Sem data definida'}</span>
      </div>
      <div class="atividade-detalhes">
        <div><strong>Nome:</strong> ${atividade.nomePessoalAtribuido}</div>
        <div><strong>Início:</strong> ${atividade.horaInicioAgendada}</div>
        <div><strong>Fim:</strong> ${atividade.fimAgendado}</div>
        <div><strong>Localização:</strong> ${atividade.descricaoLocalizacaoAtribuida}</div>
        <div><strong>Dias Agendados:</strong> ${atividade.diasAgendados || 'Não informado'}</div>
      </div>
    `;

    outputDiv.appendChild(div);
  });

  document.getElementById('filtroContainer').style.display = 'block';
}

function sendDataToServer(atividades) {
  if (!atividades || atividades.length === 0) {
    alert('Nenhum dado válido para enviar.');
    return;
  }

  fetch('http://localhost:3000/api/atividades', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(atividades),
  })
    .then(response => {
      if (!response.ok) {
        return response.text().then(text => {
          throw new Error(`Status: ${response.status} - ${text}`);
        });
      }
      return response.json();
    })
    .then(data => {
      console.log('Sucesso:', data);
      alert('Dados enviados com sucesso para o banco de dados!');
    })
    .catch(error => {
      console.error('Erro completo:', error);
      alert(`Falha ao enviar dados: ${error.message}\nVerifique se o servidor está rodando.`);
    });
}

document.getElementById('filtroDescricao').addEventListener('input', () => {
  const termo = document.getElementById('filtroDescricao').value.toLowerCase();
  const atividades = document.querySelectorAll('.atividade');

  atividades.forEach(div => {
    const descricao = div.querySelector('.atividade-header h3')?.textContent?.toLowerCase() || '';
    if (descricao.includes(termo)) {
      div.style.display = 'block';
    } else {
      div.style.display = 'none';
    }
  });
});
