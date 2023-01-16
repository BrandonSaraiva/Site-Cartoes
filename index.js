var express = require('express');
var app = express();
var port = 3000;
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
const ejs = require('ejs');

// Conexão com o banco de dados
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));

const url_mongo = 'a url do seu banco de dados'

// Conexão com o banco de dados
mongoose.connect(url_mongo, { useNewUrlParser: true, useUnifiedTopology: true });

// Definindo o Schema do banco de dados
var cartaoSchema = {
    cor: String,
    codigo: String,
    dataCriacao: String,
    data_tentativa_utilizacao: String,
    hora_tentativa_utilizacao: String,
    horaDeCriacao: String,
    utilizado: Boolean,
    dataUtilizacao: String,
    horaDeUtilizacao: String,
    dataConsulta: String,
    horaDeConsulta: String,
}


var Cartao = mongoose.model('Cartao', cartaoSchema);

// Rotas
app.get('/', (req, res) => {
    res.render('cartao', { msg1: '', msg2: '', msg3: '', msg4: '', msg5: '', msg6: '' });
});

// Rota para salvar o cartão no banco de dados
app.post('/', (req, res) => {
    // Verifica se o cartão já foi utilizado e se os campos estão preenchidos
    if (req.body.cor && req.body.codigo) {
        Cartao.find({ codigo: req.body.codigo }, function (err, cartao) {
            if (cartao.length > 0) {
                // Se o cartão já foi utilizado exibe a mensagem com a data e hora de utilização
                var dataBrasil = new Date(cartao[0].dataCriacao).toLocaleDateString('pt-BR');
                // Pegando só a hora e os minutos
                var apenasHora = cartao[0].horaDeCriacao.split(':').slice(0, 2).join(':');
                // Caso o cartão já tenha sido utilizado

                Cartao.updateOne({ codigo: req.body.codigo }, { data_tentativa_utilizacao: new Date().toLocaleDateString('pt-BR'), hora_tentativa_utilizacao: new Date().toLocaleTimeString('pt-BR').split(':').slice(0, 2).join(':') }, function (err, cartao) {
                    if (err) {
                        console.log(err);
                    }
                });

                res.render('cartao', { msg1: '', msg2: 'Código Já cadastrado no dia: ' + cartao[0].dataCriacao + ' às ' + apenasHora, msg3: '', msg4: '', msg5: '', msg6: '' });


            } else {
                // Pegando a data atual
                var d1 = Date.now();
                var data = new Date(d1);
                // Convertendo a data para o formato brasileiro
                var dataBrasil = new Date(data).toLocaleDateString('pt-BR');
                // Pegando só a hora e os minutos
                var horaEminuto = data.toLocaleTimeString().split(':').slice(0, 2).join(':');
                // Json com os dados do cartão
                var cartao = new Cartao({
                    cor: req.body.cor,
                    dataCriacao: dataBrasil,
                    codigo: req.body.codigo,
                    utilizado: false,
                    dataUtilizacao: '',
                    data_tentativa_utilizacao: '',
                    hora_tentativa_utilizacao: '',
                    horaDeUtilizacao: '',
                    horaDeCriacao: horaEminuto,
                    horaDeConsulta: '',
                    dataConsulta: ''
                });

                cartao.save();

                // Renderiza a página com a mensagem de sucesso
                res.render('cartao', { msg1: 'Cartão cadastrado com sucesso!', msg2: '', msg3: '', msg4: '', msg5: '', msg6: '' });
            }
        })
    };

    // Variavel para verificar se o cartão foi utilizado
    var conferir = req.body.cd_conferir;

    // Caso o campo de conferir esteja preenchido
    if (conferir) {

        Cartao.find({ codigo: conferir }, function (err, cartoes) {
            if (cartoes.length > 0) {
                // Pegando a data atual
                var d1 = Date.now();
                var d2 = cartoes[0].data;
                var data1 = new Date(d1);
                var data2 = new Date(d2);
                // Pegando a diferença entre as datas
                var timeDiff = Math.abs(data2.getTime() - data1.getTime());
                // Pegando a diferença em dias
                var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));

                // Pegando o dia e a hora que foi feita a consulta do cartão
                Cartao.updateOne({ codigo: conferir }, { horaDeConsulta: data1.toLocaleTimeString().split(':').slice(0, 2).join(':'), dataConsulta: data1.toLocaleDateString('pt-BR') }, function (err, res) {
                    if (err) throw err;
                });

                // Verifica se o cartão já foi utilizado
                if (cartoes[0].utilizado == true) {
                    // Pegando só a hora e os minutos
                    // Renderiza a página com a mensagem de erro
                    res.render('cartao', { msg1: '', msg2: '', msg3: 'Cartão já utilizado! Em: ' + cartoes[0].dataUtilizacao + ' às ' + cartoes[0].horaDeUtilizacao, msg4: '', msg5: '', msg6: '' });
                }
                // Verifica se o cartão está vencido
                else if (diffDays > 366) {
                    res.render('cartao', { msg1: '', msg2: '', msg3: 'Cartão expirado!', msg4: '', msg5: '', msg6: '' });
                }
                // Caso o cartão não esteja vencido e não tenha sido utilizado
                else {
                    res.render('cartao', { msg1: '', msg2: '', msg3: '', msg4: 'Cartão Ainda não utilizado!', msg5: '', msg6: '' });
                }
            }
            // Caso o cartão não esteja cadastrado
            else {
                res.render('cartao', { msg1: '', msg2: '', msg3: 'Cartão inexistente!', msg4: '', msg5: '', msg6: '' });
            }
        });
    }

    var utilizar = req.body.cd_utilização;

    // Caso o campo de utilização esteja preenchido
    if (utilizar) {
        Cartao.find({ codigo: utilizar }, function (err, cartoes) {
            if (cartoes.length > 0) {
                // Pegando a data atual
                var d1 = Date.now();
                var d2 = cartoes[0].dataCriacao;
                var date1 = new Date(d1);
                var date2 = new Date(d2);
                // Pegando a hora atual somente com os minutos
                var horaUtilizacao = date1.toLocaleTimeString().split(':').slice(0, 2).join(':');
                // Pegando a diferença entre as datas
                var timeDiff = Math.abs(date2.getTime() - date1.getTime());
                // Pegando a diferença em dias
                var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                // Converte a data para o formato brasileiro
                var dataBrasil = date1.toLocaleDateString();
                // Verifica se o cartão já foi utilizado
                if (cartoes[0].utilizado == true) {
                    // Coloquei aqui para não dar erro no console o split
                    var apenasHora = cartoes[0].horaDeUtilizacao.split(':').slice(0, 2).join(':');
                    // Renderiza a página com a mensagem de erro
                    res.render('cartao', { msg1: '', msg2: '', msg3: '', msg4: '', msg5: '', msg6: 'Cartão já utilizado em ' + cartoes[0].dataUtilizacao + ' às ' + apenasHora + 'h' });
                }
                // Verifica se o cartão está vencido
                else if (diffDays > 366) {
                    res.render('cartao', { msg1: '', msg2: '', msg3: '', msg4: '', msg5: '', msg6: 'Cartão expirado!' });

                }
                // Caso o cartão não esteja vencido e não tenha sido utilizado
                else {
                    // Atualiza o cartão para utilizado e salva a data e hora de utilização
                    Cartao.updateOne({ codigo: utilizar }, { utilizado: true, dataUtilizacao: dataBrasil, horaDeUtilizacao: horaUtilizacao }, function (err, res) {
                        if (err) throw err;
                    });
                    // Renderiza a página com a mensagem de sucesso
                    res.render('cartao', { msg1: '', msg2: '', msg3: '', msg4: '', msg5: 'Cartão utilizado com sucesso!', msg6: '' });
                }
            }
            else {
                // Renderiza a página com a mensagem de erro caso o cartão não esteja cadastrado
                res.render('cartao', { msg1: '', msg2: '', msg3: '', msg4: '', msg5: '', msg6: 'Cartão inexistente!' });
            }
        });
        ;
    }
});

// Iniciando o servidor
app.listen(port, () => {
    var URL = `http://localhost:${port}`;

    // now we open the browser automatically
    var open = require('open');

    console.log("\n\n\n\n\n\n\n                      ATENÇÃO\n\n\n\n\n\n\n                                                                                                                                                                                                                                                                                                     DEIXE ESSA TELA PRETA ABERTA PARA O SITE FICAR ONLINE");

    open(URL);
});