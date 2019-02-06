// Karma configuration
require('localenvironment')
let path = require('path')

module.exports = testService => {
  if (!testService) {
    return module.exports('local')
  }

  let modernBrowsersOnly = process.argv.indexOf('--modern_browsers_only') > 0 ? true : false
  let CI = (testService !== 'local' && (process.argv.indexOf('--local') < 0))
  let browserslist = require('browserslist')
  let pkg = require(path.join(process.cwd(),'./package.json'))

  let b = {}
  Object.keys(browserslist.data).filter(browser => {
    return /op_|opera|ie_mob|samsung/i.exec(browser) === null
  }).map(browserName => {
    var browser = browserslist.data[browserName]
    return `${browser.name} ${browser.released.pop()}`
  }).forEach(function (item, index, arr) {
    item = item.split(' ')
    var attr = (item[0] === 'edge' ? 'microsoft' : '') + item[0].toLowerCase()

    if (attr === 'ie') {
      attr = 'internet explorer'
    }

    b[attr] = item[1]
  })

  // Construct Browser Testing List
  let browsers = {}
  let keys = Object.keys(b)

  for (let i = 0; i < keys.length; i++) {
    let brwsr = keys[i].replace(/\.|\s/, '_')

    if (brwsr.indexOf('and_') < 0 && brwsr.indexOf('bb') < 0 && brwsr.indexOf('ios') < 0 && brwsr.indexOf('baidu') < 0 && brwsr.indexOf('android') < 0 && brwsr.indexOf('explorer') < 0 && brwsr.toLowerCase().indexOf('edge') < 0 && brwsr.indexOf('safari') < 0) {
      let cfg = {
        base: testService,
        browserName: keys[i],
        version: b[keys[i]] + (brwsr.indexOf('.') < 0 ? '.0' : ''),
        platform: brwsr.indexOf(/safari/i) >= 0 ? 'macOS 10.14' : 'Windows 10'
      }

      browsers['BROWSER_' + brwsr + '_' + b[keys[i]].replace(/\.|\s/, '_')] = cfg
    }
  }

  browsers['BROWSER_Chrome_45'] = {
    base: testService,
    browserName: 'chrome',
    version: '45.0',
    platform: 'Windows 10'
  }

  browsers['BROWSER_Firefox_50'] = {
    base: testService,
    browserName: 'firefox',
    version: '50.0',
    platform: 'Windows 10'
  }

  browsers['BROWSER_InternetExplorer'] = {
    base: testService,
    browserName: 'internet explorer',
    version: '11.0',
    platform: 'Windows 8.1'
  }

  browsers['BROWSER_Safari_10'] = {
    base: testService,
    browserName: 'safari',
    platform: 'OS X 16.0',
    version: '10.1'
  }

  browsers['BROWSER_Safari_12'] = {
    base: testService,
    browserName: 'safari',
    platform: 'OS X 18.0',
    version: '12.0'
  }

  browsers['BROWSER_MicrosoftEdge'] = {
    base: testService,
    browserName: 'microsoftedge',
    version: '18.17763',
    platform: 'Windows 10'
  }

  // Convert to BrowserStack format if applicable
  if (testService.toLowerCase().indexOf('browserstack') >= 0) {
    Object.keys(browsers).forEach(browser => {
      browsers[browser].browser = browsers[browser].browserName
      browsers[browser].browser_version = browsers[browser].version.trim()

      if (browsers[browser].browser === 'internet explorer') {
        browsers[browser].browser = 'IE'
      }

      if (browsers[browser].browser.toLowerCase().indexOf('edge') >= 0) {
        browsers[browser].browser = 'Edge'
        browsers[browser].browser_version = browsers[browser].browser_version.split('.')[0] + '.0'
      }

      if (!browsers[browser].platform) {
        browsers[browser].platform = 'Windows 10'
      }

      browsers[browser].os = browsers[browser].platform.split(/\s+/)[0].trim()
      browsers[browser].os_version = (browsers[browser].platform.split(/\s+/).pop() || '').trim()

      if (browsers[browser].os === 'OS' || browsers[browser].os.toLowerCase().indexOf('mac') >= 0) {
        browsers[browser].os = 'OS X'
        try {
          browsers[browser].os_version = ((require('macos-release')(browsers[browser].os_version)).name || 'Mojave').replace('OS X', '').trim()
        } catch (e) {}
      }

      delete browsers[browser].browserName
      delete browsers[browser].version
      delete browsers[browser].platform
    })
  }

  // console.log(JSON.stringify(browsers, null, 2))
  const chalk = require('chalk')
  const tablemaker = require('table').table
  const displayBrowserList = BrowserList => {
    let rows = [[chalk.bold('Browser'), chalk.bold('Version'), chalk.bold('Platform')]]

    Object.keys(BrowserList).sort().forEach(slbrowser => {
      rows.push(
        [
          (BrowserList[slbrowser].browserName || BrowserList[slbrowser].browser).trim(),
          (BrowserList[slbrowser].version || BrowserList[slbrowser].browser_version).trim(),
          (BrowserList[slbrowser].platform || BrowserList[slbrowser].os + ' ' + BrowserList[slbrowser].os_version).trim()
        ]
      )
    })

    console.log(tablemaker(rows, {
      columns: {
        1: {
          alignment: 'right'
        }
      }
    }))
  }

  let karmaconfig = {
    get configuration () {
      let cfg = {
        basePath: '',
        frameworks: ['tap', 'browserify', 'source-map-support'],
        reporters: ['tap-pretty'],
        tapReporter: {
          prettify: require('tap-diff'),
          separator: '****************************'
        },
        files: karmaconfig.getFiles(),
        port: 9876,
        colors: true,
        browserDisconnectTolerance: 2,
        browsers: ['Chrome'],
        singleRun: true,
        flags: [
          '--no-sandbox',
          '--disable-gpu',
          '--no-default-browser-check',
          '--no-first-run',
          '--disable-default-apps',
          '--disable-popup-blocking',
          '--disable-translate',
          '--disable-background-timer-throttling',
          '--disable-renderer-backgrounding',
          '--disable-device-discovery-notifications',
          '--disable-web-security'
        ]
      }

      if (CI) {
        if (testService.toLowerCase() === 'saucelabs') {
          cfg.reporters.push('saucelabs')
          cfg.sauceLabs = { // eslint-disable-line no-unused-vars
            testName: `${pkg.name} v${pkg.version}`,
            build: process.env.TRAVIS_BUILD_NUMBER || process.env.CI_BUILD_TAG || process.env.CI_BUILD_NUMBER || process.env.BUILD_NUMBER || 1,
            recordVideo: false,
            recordScreenshots: false
          }

          if (process.env.hasOwnProperty('TRAVIS_JOB_NUMBER')) {
            cfg.sauceLabs.startConnect = false
            cfg.sauceLabs.tunnelIdentifier process.env.TRAVIS_JOB_NUMBER
          }
        } else if (testService.toLowerCase() === 'browserstack') {
          cfg.browserStack = {
            username: process.env.BROWSERSTACK_USERNAME,
            accessKey: process.env.BROWSERSTACK_SECRET
          }
        }

        if (modernBrowsersOnly) {
          Object.keys(browsers).forEach(br => {
            if (['BROWSER_Chrome_45', 'BROWSER_InternetExplorer', 'BROWSER_Firefox_50'].indexOf(br) >= 0) {
              delete browsers[br]
            }
          })
        }

        cfg.customLaunchers = browsers
        cfg.browsers = Object.keys(browsers)

        displayBrowserList(browsers)
      } else {
        cfg.plugins = [
          require('karma-browserify'),
          require('tape'),
          require('karma-tap'),
          require('karma-tap-pretty-reporter'),
          require('karma-spec-reporter'),
          require('karma-chrome-launcher'),
          require('karma-firefox-launcher'),
          require('karma-safari-launcher'),
          require('karma-ie-launcher'),
          require('karma-edge-launcher'),
          require('karma-source-map-support'),
          require('karma-html2js-preprocessor'),
          require('karma-sauce-launcher'),
          require('karma-browserstack-launcher')
        ]

        var localBrowsers = {}
        Object.keys(cfg.browsers).forEach(br => {
          localBrowsers[cfg.browsers[br]] = {
            browserName: cfg.browsers[br],
            version: 'Local Copy',
            platform: (process.platform === 'win32' ? 'Windows' : (process.platform === 'debian' ? 'macOS' : process.platform)) + ' ' + require('os').release()
          }
        })

        displayBrowserList(localBrowsers)
      }

      return cfg
    },

    modernOnly () {
      modernBrowsersOnly = true
    },

    displayFiles () {
      console.log(tablemaker([[chalk.bold('Included Files')]].concat(karmaconfig.getFiles().map(file => { return [file.pattern || file] }))))
    },

    getFiles () {
      return ['./test/*.js', '/test/test.html']
    }
  }

  return karmaconfig
}
