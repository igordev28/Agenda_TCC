CREATE DATABASE TESTE;
USE TESTE;
CREATE TABLE atividades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    descricao VARCHAR(255),
    nomePessoalAtribuido VARCHAR(255),
    diasAgendados VARCHAR(255),
    horaInicioAgendada TIME,
    fimAgendado TIME,
    datasAtividadeIndividual TEXT,
    descricaoLocalizacaoAtribuida VARCHAR(255)
);

SELECT * FROM atividades;
