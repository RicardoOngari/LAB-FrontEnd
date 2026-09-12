export const categoriasVeiculos = [

  'Ônibus', 'Caminhão', 'Moto', 'Carro', 'Caminhonete',

  'Van', 'SUV', 'Esportivo', 'Trator', 'Ambulância'

];

export const dependencias = {

  'Caminhão': { id: 2, nome: 'Link VSAT (BGAN Backup)' },

  'Ônibus': { id: 4, nome: 'Sessão BGP' },

  'Moto': { id: 5, nome: 'Link LTE-Móvel' },

  'Carro': { id: 1, nome: 'Link VSAT (Hub Principal)' },

  'Caminhonete': { id: 1, nome: 'Link VSAT (Hub Principal)' },

  default: { id: 3, nome: 'Roteamento OSPF' }

};

const frotaBase = [

  ['V-01', '🚌', 'Ônibus', '85', '-23.5500', '-46.6333'],

  ['V-02', '🚚', 'Caminhão', '70', '-22.9000', '-43.2000'],

  ['V-03', '🏍️', 'Moto', '110', '-19.9200', '-43.9300'],

  ['V-04', '🚗', 'Carro', '110', '-25.4200', '-49.2700'],

  ['V-05', '🛻', 'Caminhonete', '80', '-30.0300', '-51.2300'],

  ['V-06', '🚐', 'Van', '75', '-15.7900', '-47.8800'],

  ['V-07', '🚙', 'SUV', '100', '-12.9700', '-38.5000'],

  ['V-08', '🏎️', 'Esportivo', '140', '-03.1100', '-60.0200'],

  ['V-09', '🚜', 'Trator', '30', '-16.6800', '-49.2500'],

  ['V-10', '🚑', 'Ambulância', '120', '-20.3100', '-40.3100']

];

export const fallbackDados = {

  infraestrutura: [

    { id: 1, tipo: 'Link VSAT (Hub Principal)', target: 'Satélite Star One D2', latencia: '580ms' },

    { id: 2, tipo: 'Link VSAT (BGAN Backup)', target: 'Satélite Inmarsat', latencia: '850ms' },

    { id: 3, tipo: 'Roteamento OSPF', target: 'Core Interno (10.0.0.1)', latencia: '2ms' },

    { id: 4, tipo: 'Sessão BGP', target: 'Operadora AS-1042', latencia: '12ms' },

    { id: 5, tipo: 'Link LTE-Móvel', target: 'Antena Celular ERB', latencia: '45ms' }

  ],

  frotaTotal: frotaBase.length,
  frotaPorCategoria: categoriasVeiculos.map((tipo) => ({ tipo, total: 1 })),
  frota: frotaBase.map(([id, modelo, tipo, vel, latitude, longitude]) => ({

    id, modelo, tipo, vel, latitude, longitude,

    ultima_atualizacao: new Date().toISOString()

  })),

  // SENAI Mariano Ferraz
  noc: { latitude: '-23.526389', longitude: '-46.732500' }

};