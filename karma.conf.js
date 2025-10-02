// karma.conf.js
module.exports = function (config) {
    config.set({
      basePath: '',
      frameworks: ['jasmine', '@angular-devkit/build-angular'],
      plugins: [
        require('karma-jasmine'),
        require('karma-chrome-launcher'),
        require('karma-coverage'),
        require('karma-jasmine-html-reporter'),
        require('@angular-devkit/build-angular/plugins/karma'),
      ],
      client: {
        jasmine: {},
        clearContext: false, // mantém resultados visíveis no navegador
      },
      coverageReporter: {
        dir: require('path').join(__dirname, './coverage'),
        subdir: '.',
        reporters: [
          { type: 'html' },
          { type: 'text-summary' },
        ],
      },
      reporters: ['progress', 'kjhtml', 'coverage'],
      port: 9876,
      colors: true,
      logLevel: config.LOG_INFO,
      autoWatch: true,
      browsers: ['ChromeHeadless'], // ou 'Chrome' se preferir abrir o browser
      singleRun: false,
      restartOnFileChange: true,
    });
  };
  