module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run start',
      startServerReadyPattern: 'localhost',
      url: ['http://localhost:3000/login', 'http://localhost:3000/dashboard'],
      numberOfRuns: 1,
    },
    assert: {
      assertions: {
        'categories:performance':     ['warn',  { minScore: 0.7 }],
        'categories:accessibility':   ['warn',  { minScore: 0.8 }],
        'categories:best-practices':  ['warn',  { minScore: 0.8 }],
        'categories:seo':             ['warn',  { minScore: 0.8 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
