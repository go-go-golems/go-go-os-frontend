import type { Conversation } from './types';

export const CONVERSATIONS: Conversation[] = [
  {
    id: 1, title: 'Writing a Python web scraper', model: 'GPT-4', date: '1994-03-12',
    tags: ['coding', 'python'],
    messages: [
      { role: 'user', text: 'How do I write a web scraper in Python using BeautifulSoup?' },
      { role: 'assistant', text: "Here's a basic web scraper using BeautifulSoup and requests:\n\nimport requests\nfrom bs4 import BeautifulSoup\n\nurl = 'https://example.com'\nresponse = requests.get(url)\nsoup = BeautifulSoup(response.text, 'html.parser')\n\nfor link in soup.find_all('a'):\n    print(link.get('href'))\n\nThis will fetch the page and extract all hyperlinks." },
      { role: 'user', text: 'How do I handle pagination?' },
      { role: 'assistant', text: "For pagination, you'll want to loop through page numbers:\n\nfor page in range(1, 11):\n    url = f'https://example.com/page/{page}'\n    response = requests.get(url)\n    # parse each page...\n\nAdd a time.sleep(1) between requests to be polite to the server." },
    ],
  },
  {
    id: 2, title: 'Explain quantum computing', model: 'Claude', date: '1994-03-14',
    tags: ['science', 'physics'],
    messages: [
      { role: 'user', text: 'Can you explain quantum computing in simple terms?' },
      { role: 'assistant', text: "Think of a regular computer bit like a light switch \u2014 it's either ON (1) or OFF (0). A quantum bit (qubit) is like a coin spinning in the air \u2014 it can be both heads AND tails at the same time until you catch it. This is called superposition.\n\nWhen you have multiple qubits, they can be entangled \u2014 meaning the state of one instantly affects the other, no matter the distance. This lets quantum computers explore many possibilities simultaneously." },
      { role: 'user', text: 'What problems can quantum computers solve better?' },
      { role: 'assistant', text: "Quantum computers excel at:\n\n\u2022 Cryptography \u2014 breaking and creating encryption\n\u2022 Drug discovery \u2014 simulating molecular interactions\n\u2022 Optimization \u2014 finding best routes, schedules\n\u2022 Financial modeling \u2014 complex risk analysis\n\u2022 Machine learning \u2014 faster training of certain models\n\nThey won't replace classical computers for everyday tasks, but for specific complex problems, they offer exponential speedups." },
    ],
  },
  {
    id: 3, title: 'Recipe for sourdough bread', model: 'GPT-4', date: '1994-03-15',
    tags: ['cooking', 'baking'],
    messages: [
      { role: 'user', text: 'Give me a sourdough bread recipe for beginners' },
      { role: 'assistant', text: "Beginner Sourdough Bread:\n\nIngredients:\n\u2022 500g bread flour\n\u2022 350g water (warm)\n\u2022 100g active sourdough starter\n\u2022 10g salt\n\nDay 1: Mix flour and water, rest 30 min. Add starter and salt. Fold dough every 30 min for 2 hours. Refrigerate overnight.\n\nDay 2: Shape into a round loaf. Let rise 2 hours. Bake in a Dutch oven at 450\u00B0F \u2014 30 min covered, 15 min uncovered.\n\nThe crust should be deep golden brown and sound hollow when tapped." },
    ],
  },
  {
    id: 4, title: 'JavaScript async/await patterns', model: 'Claude', date: '1994-03-18',
    tags: ['coding', 'javascript'],
    messages: [
      { role: 'user', text: 'Explain async/await in JavaScript' },
      { role: 'assistant', text: "async/await is syntactic sugar over Promises that makes asynchronous code look synchronous.\n\nasync function fetchData() {\n  try {\n    const response = await fetch('/api/data');\n    const data = await response.json();\n    return data;\n  } catch (error) {\n    console.error('Failed:', error);\n  }\n}\n\nThe 'await' keyword pauses execution until the Promise resolves, but doesn't block the thread. The function must be marked 'async' to use 'await' inside it." },
      { role: 'user', text: 'How do I run multiple async operations in parallel?' },
      { role: 'assistant', text: "Use Promise.all() to run operations concurrently:\n\nasync function fetchAll() {\n  const [users, posts, comments] = await Promise.all([\n    fetch('/api/users').then(r => r.json()),\n    fetch('/api/posts').then(r => r.json()),\n    fetch('/api/comments').then(r => r.json())\n  ]);\n  return { users, posts, comments };\n}\n\nThis fires all three requests at once and waits for all to complete. Much faster than awaiting each sequentially!" },
    ],
  },
  {
    id: 5, title: 'History of the Roman Empire', model: 'GPT-4', date: '1994-03-20',
    tags: ['history', 'education'],
    messages: [
      { role: 'user', text: 'Give me an overview of the fall of the Roman Empire' },
      { role: 'assistant', text: 'The fall of the Western Roman Empire (476 AD) resulted from multiple converging factors:\n\nMilitary: Increasing reliance on Germanic mercenaries who had divided loyalties. Constant barbarian invasions stretched defenses thin.\n\nEconomic: Heavy taxation, inflation, and disrupted trade. The cost of maintaining the army became unsustainable.\n\nPolitical: Rapid turnover of emperors \u2014 some ruling only weeks. Corruption was rampant. The empire split into East and West in 285 AD.\n\nSocial: Urban decline, population decrease from plagues, and loss of civic virtue.\n\nThe final blow came when the Germanic chieftain Odoacer deposed the last emperor, Romulus Augustulus, in 476 AD.' },
    ],
  },
  {
    id: 6, title: 'Debugging CSS flexbox layout', model: 'Claude', date: '1994-03-22',
    tags: ['coding', 'css'],
    messages: [
      { role: 'user', text: "My flexbox items won't center vertically. Help!" },
      { role: 'assistant', text: "The most common issue is that the flex container doesn't have an explicit height. Here's the fix:\n\n.container {\n  display: flex;\n  align-items: center;      /* vertical centering */\n  justify-content: center;  /* horizontal centering */\n  min-height: 100vh;        /* THIS IS KEY */\n}\n\nWithout a defined height, there's no vertical space to center within. Also make sure no parent element is constraining the height." },
    ],
  },
  {
    id: 7, title: 'Planning a trip to Japan', model: 'GPT-4', date: '1994-03-25',
    tags: ['travel', 'planning'],
    messages: [
      { role: 'user', text: "I'm planning a 2-week trip to Japan. What should I see?" },
      { role: 'assistant', text: "Here's a suggested 2-week Japan itinerary:\n\nWeek 1 \u2014 Tokyo & Surrounds:\n\u2022 Days 1-3: Tokyo (Shibuya, Akihabara, Meiji Shrine, Tsukiji)\n\u2022 Day 4: Day trip to Kamakura (Great Buddha)\n\u2022 Day 5: Day trip to Hakone (Mt. Fuji views, hot springs)\n\nWeek 2 \u2014 Kansai & Beyond:\n\u2022 Days 6-7: Kyoto (Fushimi Inari, Arashiyama, temples)\n\u2022 Day 8: Nara (deer park, Todai-ji)\n\u2022 Days 9-10: Osaka (street food in Dotonbori)\n\u2022 Day 11: Hiroshima & Miyajima Island\n\u2022 Days 12-14: Return to Tokyo, explore neighborhoods\n\nGet a 14-day Japan Rail Pass \u2014 it pays for itself quickly." },
    ],
  },
  {
    id: 8, title: 'Understanding neural networks', model: 'Claude', date: '1994-04-01',
    tags: ['ai', 'machine-learning'],
    messages: [
      { role: 'user', text: 'Explain how a neural network learns' },
      { role: 'assistant', text: "A neural network learns through a process called backpropagation:\n\n1. FORWARD PASS: Input data flows through layers of neurons. Each neuron multiplies inputs by weights, adds a bias, and applies an activation function.\n\n2. LOSS CALCULATION: The output is compared to the expected answer. The difference is the 'loss' or error.\n\n3. BACKWARD PASS: The error is propagated backwards through the network. Using calculus (chain rule), we calculate how much each weight contributed to the error.\n\n4. UPDATE WEIGHTS: Each weight is adjusted slightly to reduce the error. The learning rate controls how big each adjustment is.\n\n5. REPEAT: This process happens thousands or millions of times with different training examples until the network converges on good weights." },
    ],
  },
  {
    id: 9, title: 'Gardening tips for beginners', model: 'GPT-4', date: '1994-04-03',
    tags: ['gardening', 'hobby'],
    messages: [
      { role: 'user', text: 'I want to start a vegetable garden. What should I grow first?' },
      { role: 'assistant', text: "Great beginner vegetables:\n\n\u2022 Tomatoes \u2014 rewarding, prolific producers\n\u2022 Lettuce & greens \u2014 fast-growing, harvest in weeks\n\u2022 Zucchini \u2014 nearly impossible to kill\n\u2022 Herbs (basil, mint, parsley) \u2014 small space, big flavor\n\u2022 Green beans \u2014 direct sow, minimal care\n\u2022 Radishes \u2014 ready in 25 days!\n\nStart with a 4x8 raised bed. Use quality potting mix. Water consistently (morning is best). Give plants 6+ hours of direct sunlight. Don't plant too close together \u2014 read spacing on seed packets.\n\nMost importantly: start small. A tiny thriving garden beats a large neglected one." },
    ],
  },
  {
    id: 10, title: 'SQL query optimization', model: 'Claude', date: '1994-04-05',
    tags: ['coding', 'database'],
    messages: [
      { role: 'user', text: 'My SQL queries are running very slowly. How do I optimize them?' },
      { role: 'assistant', text: "Key SQL optimization strategies:\n\n1. INDEXING: Add indexes on columns used in WHERE, JOIN, and ORDER BY clauses. This is the single biggest performance win.\n\nCREATE INDEX idx_users_email ON users(email);\n\n2. AVOID SELECT *: Only fetch columns you need.\n\n3. USE EXPLAIN: Prefix your query with EXPLAIN to see the execution plan and identify bottlenecks.\n\n4. LIMIT RESULTS: Use LIMIT for large tables when you don't need all rows.\n\n5. OPTIMIZE JOINS: Ensure join columns are indexed. Use INNER JOIN instead of subqueries when possible.\n\n6. BATCH OPERATIONS: Instead of 1000 individual INSERTs, use bulk insert syntax.\n\n7. AVOID FUNCTIONS IN WHERE: WHERE YEAR(date) = 2024 can't use an index. Use WHERE date >= '2024-01-01' instead." },
    ],
  },
];

export function getAllTags(conversations: Conversation[]): string[] {
  return [...new Set(conversations.flatMap((c) => c.tags))].sort();
}

export function getAllModels(conversations: Conversation[]): string[] {
  return [...new Set(conversations.map((c) => c.model))].sort();
}
