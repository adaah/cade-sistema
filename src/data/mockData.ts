export const programs = [
  { id: 'cc', name: 'Ciência da Computação', code: 'CC' },
  { id: 'ec', name: 'Engenharia da Computação', code: 'EC' },
  { id: 'si', name: 'Sistemas de Informação', code: 'SI' },
  { id: 'ee', name: 'Engenharia Elétrica', code: 'EE' },
  { id: 'em', name: 'Engenharia Mecânica', code: 'EM' },
  { id: 'mat', name: 'Matemática', code: 'MAT' },
  { id: 'fis', name: 'Física', code: 'FIS' },
];

export interface DisciplineClass {
  code: string;
  professor: string;
  schedule: string;
  room: string;
  slots: number;
  enrolled: number;
}

export interface Discipline {
  code: string;
  name: string;
  credits: number;
  workload: number;
  semester: number;
  type: 'obrigatoria' | 'optativa';
  prerequisites: string[];
  description: string;
  classes: DisciplineClass[];
}

export const disciplines: Discipline[] = [
  {
    code: 'MATA40',
    name: 'Estrutura de Dados e Algoritmos I',
    credits: 4,
    workload: 68,
    semester: 3,
    type: 'obrigatoria',
    prerequisites: ['MATA37', 'MATA42'],
    description: 'Estudo de estruturas de dados fundamentais como listas, pilhas, filas, árvores e grafos. Análise de complexidade de algoritmos.',
    classes: [
      { code: 'T01', professor: 'Dr. Carlos Silva', schedule: 'Ter/Qui 08:50-10:40', room: 'PAF I - 109', slots: 40, enrolled: 38 },
      { code: 'T02', professor: 'Dra. Maria Santos', schedule: 'Seg/Qua 13:00-14:50', room: 'PAF I - 110', slots: 40, enrolled: 40 },
      { code: 'T03', professor: 'Dr. João Oliveira', schedule: 'Ter/Qui 15:00-16:50', room: 'PAF I - 111', slots: 35, enrolled: 20 },
    ]
  },
  {
    code: 'MATA37',
    name: 'Introdução à Lógica de Programação',
    credits: 4,
    workload: 68,
    semester: 1,
    type: 'obrigatoria',
    prerequisites: [],
    description: 'Fundamentos de programação, algoritmos básicos, estruturas de controle e funções.',
    classes: [
      { code: 'T01', professor: 'Dr. Pedro Lima', schedule: 'Seg/Qua 08:50-10:40', room: 'PAF I - 201', slots: 45, enrolled: 42 },
      { code: 'T02', professor: 'Dra. Ana Costa', schedule: 'Ter/Qui 10:40-12:30', room: 'PAF I - 202', slots: 45, enrolled: 44 },
    ]
  },
  {
    code: 'MATA42',
    name: 'Matemática Discreta I',
    credits: 4,
    workload: 68,
    semester: 2,
    type: 'obrigatoria',
    prerequisites: [],
    description: 'Lógica proposicional, teoria dos conjuntos, relações, funções, indução matemática e contagem.',
    classes: [
      { code: 'T01', professor: 'Dr. Roberto Mendes', schedule: 'Seg/Qua 15:00-16:50', room: 'IM - 102', slots: 50, enrolled: 48 },
    ]
  },
  {
    code: 'MATA50',
    name: 'Linguagens Formais e Autômatos',
    credits: 4,
    workload: 68,
    semester: 4,
    type: 'obrigatoria',
    prerequisites: ['MATA40', 'MATA42'],
    description: 'Autômatos finitos, expressões regulares, gramáticas livres de contexto, máquinas de Turing.',
    classes: [
      { code: 'T01', professor: 'Dr. Felipe Alves', schedule: 'Ter/Qui 13:00-14:50', room: 'PAF I - 305', slots: 35, enrolled: 30 },
    ]
  },
  {
    code: 'MATA55',
    name: 'Programação Orientada a Objetos',
    credits: 4,
    workload: 68,
    semester: 3,
    type: 'obrigatoria',
    prerequisites: ['MATA37'],
    description: 'Conceitos de POO, classes, herança, polimorfismo, interfaces e padrões de projeto básicos.',
    classes: [
      { code: 'T01', professor: 'Dra. Lucia Fernandes', schedule: 'Seg/Qua 10:40-12:30', room: 'PAF I - 112', slots: 40, enrolled: 39 },
      { code: 'T02', professor: 'Dr. Marcos Souza', schedule: 'Ter/Qui 08:50-10:40', room: 'PAF I - 113', slots: 40, enrolled: 35 },
    ]
  },
  {
    code: 'MATA60',
    name: 'Banco de Dados',
    credits: 4,
    workload: 68,
    semester: 5,
    type: 'obrigatoria',
    prerequisites: ['MATA55'],
    description: 'Modelagem de dados, SQL, normalização, transações e sistemas de gerenciamento de banco de dados.',
    classes: [
      { code: 'T01', professor: 'Dr. Ricardo Pereira', schedule: 'Seg/Qua 13:00-14:50', room: 'PAF I - 401', slots: 35, enrolled: 33 },
    ]
  },
  {
    code: 'MATA62',
    name: 'Engenharia de Software I',
    credits: 4,
    workload: 68,
    semester: 5,
    type: 'obrigatoria',
    prerequisites: ['MATA55'],
    description: 'Processos de desenvolvimento, requisitos, projeto de software, testes e qualidade.',
    classes: [
      { code: 'T01', professor: 'Dra. Carolina Dias', schedule: 'Ter/Qui 15:00-16:50', room: 'PAF I - 402', slots: 40, enrolled: 38 },
    ]
  },
  {
    code: 'MATC90',
    name: 'Inteligência Artificial',
    credits: 4,
    workload: 68,
    semester: 6,
    type: 'optativa',
    prerequisites: ['MATA40'],
    description: 'Busca, representação do conhecimento, aprendizado de máquina, redes neurais.',
    classes: [
      { code: 'T01', professor: 'Dr. Bruno Martins', schedule: 'Seg/Qua 08:50-10:40', room: 'PAF I - 501', slots: 30, enrolled: 30 },
    ]
  },
  {
    code: 'MATC94',
    name: 'Computação Gráfica',
    credits: 4,
    workload: 68,
    semester: 6,
    type: 'optativa',
    prerequisites: ['MATA40'],
    description: 'Transformações geométricas, renderização, iluminação, texturas e animação.',
    classes: [
      { code: 'T01', professor: 'Dra. Patricia Lopes', schedule: 'Ter/Qui 10:40-12:30', room: 'PAF I - 502', slots: 25, enrolled: 18 },
    ]
  },
  {
    code: 'MAT236',
    name: 'Cálculo A',
    credits: 6,
    workload: 102,
    semester: 1,
    type: 'obrigatoria',
    prerequisites: [],
    description: 'Limites, derivadas, integrais de funções de uma variável real.',
    classes: [
      { code: 'T01', professor: 'Dr. Antonio Rocha', schedule: 'Seg/Qua/Sex 07:00-08:50', room: 'IM - 201', slots: 60, enrolled: 55 },
      { code: 'T02', professor: 'Dra. Helena Castro', schedule: 'Ter/Qui/Sex 13:00-14:50', room: 'IM - 202', slots: 60, enrolled: 58 },
    ]
  },
  {
    code: 'FIS126',
    name: 'Física Geral I',
    credits: 4,
    workload: 68,
    semester: 2,
    type: 'obrigatoria',
    prerequisites: ['MAT236'],
    description: 'Mecânica clássica, cinemática, dinâmica, energia e momento.',
    classes: [
      { code: 'T01', professor: 'Dr. Fernando Luz', schedule: 'Seg/Qua 15:00-16:50', room: 'IF - 101', slots: 50, enrolled: 47 },
    ]
  },
  {
    code: 'MATA64',
    name: 'Redes de Computadores I',
    credits: 4,
    workload: 68,
    semester: 6,
    type: 'obrigatoria',
    prerequisites: ['MATA55'],
    description: 'Arquitetura de redes, protocolos TCP/IP, camadas de rede, segurança básica.',
    classes: [
      { code: 'T01', professor: 'Dr. Gustavo Reis', schedule: 'Ter/Qui 08:50-10:40', room: 'PAF I - 601', slots: 35, enrolled: 32 },
    ]
  },
];

export const flowchartData = {
  semesters: [
    {
      number: 1,
      disciplines: ['MATA37', 'MAT236']
    },
    {
      number: 2,
      disciplines: ['MATA42', 'FIS126']
    },
    {
      number: 3,
      disciplines: ['MATA40', 'MATA55']
    },
    {
      number: 4,
      disciplines: ['MATA50']
    },
    {
      number: 5,
      disciplines: ['MATA60', 'MATA62']
    },
    {
      number: 6,
      disciplines: ['MATC90', 'MATC94', 'MATA64']
    }
  ]
};
