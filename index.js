// Karma configuration
require('localenvironment')
let path = require('path')
let modernBrowsersOnly = process.argv.indexOf('--modern_browsers_only') > 0 ? true : false
let CI = (process.env.hasOwnProperty('SAUCE_USERNAME') && (process.argv.indexOf('--local') < 0)) ? true : false
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
      base: 'SauceLabs',
      browserName: keys[i],
      version: b[keys[i]] + (brwsr.indexOf('safari') >= 0 ? '.0' : ''),
      platform: brwsr.indexOf(/safari/i) >= 0 ? 'macOS 10.14' : 'Windows 10'
    }

    browsers['SL_' + brwsr + '_' + b[keys[i]].replace(/\.|\s/, '_')] = cfg
  }
}

browsers['SL_Chrome_45'] = {
  base: 'SauceLabs',
  browserName: 'chrome',
  version: '45.0',
  platform: 'Windows 7'
}

browsers['SL_Firefox_50'] = {
  base: 'SauceLabs',
  browserName: 'firefox',
  version: '50.0',
  platform: 'Windows 7'
}

browsers['SL_InternetExplorer'] = {
  base: 'SauceLabs',
  browserName: 'internet explorer',
  version: '11.0',
  platform: 'Windows 7'
}

browsers['SL_Safari_10'] = {
  base: 'SauceLabs',
  browserName: 'safari',
  platform: 'OS X 10.11',
  version: '10.0'
}

// browsers['SL_Safari_12'] = {
//   base: 'SauceLabs',
//   browserName: 'safari',
//   platform: 'macOS 10.14',
//   version: '12.0'
// }

browsers['SL_MicrosoftEdge'] = {
  base: 'SauceLabs',
  browserName: 'microsoftedge',
  version: '18.17763',
  platform: 'Windows 10'
}

// console.log(JSON.stringify(browsers, null, 2))
const chalk = require('chalk')
const tablemaker = require('table').table
const displayBrowserList = BrowserList => {
  let rows = [[chalk.bold('Browser'), chalk.bold('Version')]]

  Object.keys(BrowserList).sort().forEach(slbrowser => {
    rows.push([BrowserList[slbrowser].browserName, BrowserList[slbrowser].version])
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
      captureTimeout: 120000,
      browserDisconnectTimeout: 120000,
      browserNoActivityTimeout: 120000,
      browserDisconnectTolerance: 2,
      browsers: ['Chrome'],
      singleRun: true
    }

    if (CI) {
      cfg.reporters.push('saucelabs')
      cfg.sauceLabs = { // eslint-disable-line no-unused-vars
        testName: `${pkg.name} v${pkg.version}`,
        build: process.env.TRAVIS_BUILD_NUMBER || process.env.CI_BUILD_TAG || process.env.CI_BUILD_NUMBER || process.env.BUILD_NUMBER || 1,
        recordVideo: false,
        recordScreenshots: false
      }

      if (modernBrowsersOnly) {
        Object.keys(browsers).forEach(br => {
          if (['SL_Chrome_45', 'SL_InternetExplorer', 'SL_Firefox_50'].indexOf(br) >= 0) {
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
        require('karma-sauce-launcher')
      ]

      var localBrowsers = {}
      Object.keys(cfg.browsers).forEach(br => {
        localBrowsers[cfg.browsers[br]] = {
          browserName: cfg.browsers[br],
          version: 'Local Installation'
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

module.exports = karmaconfig
