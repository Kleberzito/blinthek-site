<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
// Defina o seu endereço de e-mail
$destinatario = "seuemail@gmail.com";

// Pegue os dados do formulário
$nome = $_POST["nome"] ?? '';
$email = $_POST["email"] ?? '';
$cidade = $_POST["cidade"] ?? '';
$telefone = $_POST["telefone"] ?? '';
$mensagem = $_POST["mensagem"] ?? '';

// Crie a mensagem do e-mail
$assunto = "Mensagem do formulário do site";
$corpo = "Nome: $nome\nEmail: $email\nCidade: $cidade\nTelefone: $telefone\nMensagem: $mensagem";

// Envie o e-mail
mail($destinatario, $assunto, $corpo);

?>