/**
 * validacao.js — reatividade do formulário de cadastro (rota
 * "/cadastro"): máscaras de entrada, validação por campo e envio.
 *
 * O formulário é recriado do zero toda vez que a rota "/cadastro" é
 * montada (fetch + innerHTML em templates.js), então iniciarCadastro()
 * é chamada pelo roteador DEPOIS da injeção do HTML, a cada visita —
 * nunca uma vez só no carregamento da página. Isso também evita
 * listeners "fantasmas": como os elementos são recriados a cada
 * visita, não há acúmulo de handlers antigos presos a nós que já
 * saíram do DOM.
 */
import { salvarVoluntario } from './armazenamento.js';

export function iniciarCadastro() {
  const form = document.getElementById('form-voluntario');
  if (!form) return; // rota diferente montada — nada a fazer

  const campoCPF = document.getElementById('cpf');
  const campoTelefone = document.getElementById('telefone');
  const campoCEP = document.getElementById('cep');
  const campoNascimento = document.getElementById('nascimento');
  if (campoNascimento) {
    campoNascimento.max = new Date().toISOString().slice(0, 10);
  }
  const campoLogradouro = document.getElementById('logradouro');
  const campoBairro = document.getElementById('bairro');
  const campoCidade = document.getElementById('cidade');
  const campoEstado = document.getElementById('estado');

  /* =========================================================
     1. EVENTO "input" — máscaras de formatação progressiva
     ========================================================= */
  function apenasDigitos(valor) {
    return valor.replace(/\D/g, '');
  }

  function mascararCPF(valor) {
    valor = apenasDigitos(valor).slice(0, 11);
    valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
    valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
    valor = valor.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    return valor;
  }

  function mascararTelefone(valor) {
    valor = apenasDigitos(valor).slice(0, 11);
    if (valor.length > 10) {
      valor = valor.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
    } else if (valor.length > 6) {
      valor = valor.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    } else if (valor.length > 2) {
      valor = valor.replace(/(\d{2})(\d{0,4})/, '($1) $2');
    } else if (valor.length > 0) {
      valor = valor.replace(/(\d{0,2})/, '($1');
    }
    return valor.trim();
  }

  function mascararCEP(valor) {
    valor = apenasDigitos(valor).slice(0, 8);
    if (valor.length > 5) {
      valor = valor.replace(/(\d{5})(\d{0,3})/, '$1-$2');
    }
    return valor;
  }

  // A cada tecla digitada (evento "input"), reescrevo o valor do campo
  // já formatado e reposiciono o cursor — sem isso, o cursor saltaria
  // para o fim do campo a cada caractere.
  function aplicarMascara(campo, funcaoMascara) {
    campo.addEventListener('input', function () {
      const posicaoOriginal = campo.selectionStart;
      const tamanhoAntes = campo.value.length;
      campo.value = funcaoMascara(campo.value);
      const diferenca = campo.value.length - tamanhoAntes;
      const novaPosicao = Math.max(0, (posicaoOriginal || 0) + diferenca);
      campo.setSelectionRange(novaPosicao, novaPosicao);
    });
  }

  if (campoCPF) aplicarMascara(campoCPF, mascararCPF);
  if (campoTelefone) aplicarMascara(campoTelefone, mascararTelefone);
  if (campoCEP) aplicarMascara(campoCEP, mascararCEP);

  /* =========================================================
     2. REGRAS DE VALIDAÇÃO (além de required/pattern nativos)
     ========================================================= */
  function cpfValido(cpfFormatado) {
    const cpf = apenasDigitos(cpfFormatado);
    if (cpf.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpf)) return false;
    let soma = 0;
    for (let i = 0; i < 9; i++) soma += Number(cpf[i]) * (10 - i);
    let resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== Number(cpf[9])) return false;
    soma = 0;
    for (let i = 0; i < 10; i++) soma += Number(cpf[i]) * (11 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    return resto === Number(cpf[10]);
  }

  function telefoneValido(telefoneFormatado) {
    const numero = apenasDigitos(telefoneFormatado);
    if (numero.length !== 10 && numero.length !== 11) return false;
    const ddd = Number(numero.slice(0, 2));
    return ddd >= 11 && ddd <= 99;
  }

  function cepValido(cepFormatado) {
    return apenasDigitos(cepFormatado).length === 8;
  }

  function idadeMinimaValida(dataISO) {
    if (!dataISO) return false;
    const nascimento = new Date(dataISO + 'T00:00:00');
    if (Number.isNaN(nascimento.getTime())) return false;
    const hoje = new Date();
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const aindaNaoFezAniversario =
      hoje.getMonth() < nascimento.getMonth() ||
      (hoje.getMonth() === nascimento.getMonth() && hoje.getDate() < nascimento.getDate());
    if (aindaNaoFezAniversario) idade--;
    return idade >= 16 && nascimento <= hoje;
  }

  function exibirErro(campo, mensagem) {
    const wrapper = campo.closest('.campo, .consentimento');
    if (!wrapper) return;
    wrapper.classList.add('invalido');
    wrapper.classList.remove('valido');
    const spanErro = wrapper.querySelector('.erro-msg');
    if (spanErro) spanErro.textContent = mensagem;
    campo.setAttribute('aria-invalid', 'true');
  }

  function limparErro(campo) {
    const wrapper = campo.closest('.campo, .consentimento');
    if (!wrapper) return;
    wrapper.classList.remove('invalido');
    wrapper.classList.add('valido');
    const spanErro = wrapper.querySelector('.erro-msg');
    if (spanErro) spanErro.textContent = '';
    campo.removeAttribute('aria-invalid');
  }

  function mensagemValidacaoNativa(campo) {
    const v = campo.validity;
    if (v.valueMissing) {
      return campo.type === 'checkbox' ? 'Marque esta opção para continuar.' : 'Preencha este campo.';
    }
    if (v.typeMismatch && campo.type === 'email') return 'Informe um e-mail válido, como nome@exemplo.com.';
    if (v.tooShort) return `Digite pelo menos ${campo.minLength} caracteres.`;
    return campo.validationMessage || 'Valor inválido.';
  }

  const validadoresExtras = [
    { campo: campoCPF, teste: cpfValido, mensagem: 'CPF inválido. Confira os números digitados.' },
    { campo: campoTelefone, teste: telefoneValido, mensagem: 'Telefone inválido. Use o formato (DDD) 9XXXX-XXXX.' },
    { campo: campoCEP, teste: cepValido, mensagem: 'CEP inválido. Deve conter 8 dígitos.' },
    { campo: campoNascimento, teste: idadeMinimaValida, mensagem: 'É preciso ter 16 anos ou mais e informar uma data válida.' },
  ];

  function validarCampo(item) {
    if (!item.campo) return true;
    const vazio = item.campo.value.trim() === '';
    if (vazio && !item.campo.required) {
      limparErro(item.campo);
      return true;
    }
    if (vazio) {
      exibirErro(item.campo, 'Preencha este campo.');
      return false;
    }
    if (!item.teste(item.campo.value)) {
      exibirErro(item.campo, item.mensagem);
      return false;
    }
    limparErro(item.campo);
    return true;
  }

  /* =========================================================
     3. EVENTO "blur" — feedback assim que o usuário sai do campo,
     sem esperar pela tentativa de envio
     ========================================================= */
  validadoresExtras.forEach(function (item) {
    if (!item.campo) return;
    item.campo.addEventListener('blur', function () {
      validarCampo(item);
    });
  });

  form.querySelectorAll('input[required], select[required], textarea[required]').forEach(function (campo) {
    if ([campoCPF, campoTelefone, campoCEP, campoNascimento].includes(campo)) return;
    campo.addEventListener('blur', function () {
      if (!campo.checkValidity()) {
        exibirErro(campo, mensagemValidacaoNativa(campo));
      } else {
        limparErro(campo);
      }
    });
  });

  // Busca de endereço pelo CEP: reage ao "blur" do campo CEP, não ao
  // "input" (evita disparar uma requisição a cada tecla digitada).
  async function buscarEnderecoPorCEP(cepFormatado) {
    if (!campoLogradouro || !cepValido(cepFormatado)) return;
    const cep = apenasDigitos(cepFormatado);
    try {
      const resposta = await fetch('https://viacep.com.br/ws/' + cep + '/json/');
      if (!resposta.ok) return;
      const dados = await resposta.json();
      if (dados.erro) {
        exibirErro(campoCEP, 'CEP não encontrado. Verifique o número digitado.');
        return;
      }
      campoLogradouro.value = dados.logradouro || '';
      campoBairro.value = dados.bairro || '';
      campoCidade.value = dados.localidade || '';
      campoEstado.value = dados.uf || '';
      limparErro(campoCEP);
    } catch (erro) {
      console.info('[validacao.js] Preenchimento automático de endereço indisponível; preencha manualmente.');
    }
  }
  if (campoCEP) {
    campoCEP.addEventListener('blur', function () {
      buscarEnderecoPorCEP(campoCEP.value);
    });
  }

  /* =========================================================
     4. EVENTO "invalid" — a tentativa nativa de envio dispara um
     "invalid" por campo problemático; escuto em fase de captura
     (form não recebe bubbling de "invalid") só para trocar a bolha
     padrão do navegador pela mensagem em português já usada no
     restante do formulário — quem decide se é válido continua sendo
     o próprio navegador.
     ========================================================= */
  form.addEventListener('invalid', function (evento) {
    evento.preventDefault();
    const campo = evento.target;
    const item = validadoresExtras.find(function (i) { return i.campo === campo; });
    if (item) {
      validarCampo(item);
    } else {
      exibirErro(campo, mensagemValidacaoNativa(campo));
    }
    campo.focus();
  }, true);

  /* =========================================================
     5. EVENTO "submit" — impede o comportamento padrão do navegador
     (que recarregaria o documento) para que a lógica da SPA controle
     toda a jornada: validar, e só então trocar o formulário pela
     confirmação, sem sair da rota atual.
     ========================================================= */
  form.addEventListener('submit', function (evento) {
    evento.preventDefault();

    let formularioValido = form.checkValidity();
    validadoresExtras.forEach(function (item) {
      if (!validarCampo(item)) formularioValido = false;
    });
    form.querySelectorAll('input, select, textarea').forEach(function (campo) {
      if (!campo.checkValidity() && !validadoresExtras.some((i) => i.campo === campo)) {
        exibirErro(campo, mensagemValidacaoNativa(campo));
        formularioValido = false;
      }
    });

    if (!formularioValido) {
      const primeiroInvalido = form.querySelector('.invalido input, .invalido select, .invalido textarea');
      if (primeiroInvalido) primeiroInvalido.focus();
      return;
    }

    // Reúno os campos do formulário num objeto simples — inclusive
    // "dias", que tem vários checkboxes com o mesmo name e por isso
    // precisa de getAll() em vez de get() — para entregar a
    // armazenamento.js, o único módulo que sabe falar com o
    // localStorage.
    const dadosFormulario = Object.fromEntries(new FormData(form).entries());
    dadosFormulario.dias = new FormData(form).getAll('dias');
    const historico = salvarVoluntario(dadosFormulario);

    const nome = dadosFormulario.nome.trim().split(' ')[0];
    form.hidden = true;
    const confirmacao = document.getElementById('confirmacao-envio');
    if (confirmacao) {
      confirmacao.hidden = false;
      confirmacao.querySelector('[data-nome]').textContent = nome;
      confirmacao.querySelector('[data-total]').textContent =
        `Este é o cadastro nº ${historico.length} salvo neste navegador.`;
      confirmacao.focus();
    }
  });
}
