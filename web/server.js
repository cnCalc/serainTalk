const express = require('express');
const fs = require('fs');
const path = require('path');
const { createBundleRenderer } = require('vue-server-renderer');
const axios = require('axios');
const serverConf = require('../config/staticConfig');
const cookieParser = require('cookie-parser');

axios.defaults.baseURL = serverConf.siteAddress;

const isProd = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';
const serve = (p, cache) => express.static(path.resolve(__dirname, p), {
  maxAge: cache && isProd ? 1000 * 60 * 60 * 24 * 30 : 0,
});

let site = express();

// Parse cookie
site.use(cookieParser());

// disable 'x-powered-by' for security
site.disable('x-powered-by');

// Factory for Vue renderer
function createRenderer (bundle, options) {
  return createBundleRenderer(bundle, Object.assign(options, {
    basedir: path.resolve(__dirname, './dist'),
    runInNewContext: false,
  }));
}

// Renderer and HTML template
let renderer, readyPromise;
const templatePath = path.resolve(__dirname, 'src/index.html');

// Setup server renderer
if (isProd || isTest) {
  // Create renderer once, and keeping using it until SIGTERM
  const template = fs.readFileSync(templatePath, 'utf-8');
  const bundle = require('./dist/vue-ssr-server-bundle.json');
  const clientManifest = require('./dist/vue-ssr-client-manifest.json');
  renderer = createRenderer(bundle, {
    template,
    clientManifest,
  });
} else {
  // Use webpack-dev-middleware, recreate renderer in case source is changed.
  readyPromise = require('./build/setup-dev-server')(
    site,
    templatePath,
    (bundle, options) => {
      renderer = createRenderer(bundle, options);
    }
  );
}

// Setup some static files
site.use('/dist', serve('./dist', true));
site.use('/public', serve('./public', true));
site.use('/manifest.json', serve('./manifest.json', true));
site.use('/service-worker.js', serve('./dist/service-worker.js'));
site.get('/favicon.ico', (req, res) => res.status(404).end());
// disallow all robots access as it is a beta version
site.get('/robots.txt', (req, res) => {
  res.send([
    'User-agent: *',
    'Disallow: /',
  ].join('\n'));
});

// The actual render entry.
async function render (req, res) {
  res.setHeader('Content-Type', 'text/html');

  const errorHandler = err => {
    if (err.url) {
      res.redirect(err.url);
    } else {
      res.status(500).send('500');
      console.log(err);
    }
  };

  const context = {
    url: req.url,
    title: 'cnCalc',
    // meta: clientConfig.meta,
  };

  if (req.cookies.membertoken) {
    try {
      const { data } = await axios.get('/api/v1/member/me', {
        headers: {
          cookie: `membertoken=${req.cookies.membertoken}`,
        },
      });

      context.nightmode = data.memberInfo.settings.nightmode;
      context.autoTheme = data.memberInfo.settings.autoTheme;
    } catch (e) {}
  }

  if (req.path === '/not-found') {
    res.status(404);
  }

  renderer.renderToString(context, (err, html) => {
    if (err) {
      return errorHandler(err);
    }
    res.send(html);
  });
}

// Redirect Discuz's URL
function discuzRedirectHandler (req, res, next) {
  const tid = req.query.tid || req.params.tid;
  const uid = req.query.uid || req.params.uid;

  if (tid) {
    axios.get(`/api/v1/discuz-lookup?tid=${tid}`)
      .then(response => {
        res.redirect(`/d/${response.data.discussionId}`);
      })
      .catch(next);
  } else if (uid) {
    axios.get(`/api/v1/discuz-lookup?uid=${uid}`)
      .then(response => {
        res.redirect(`/m/${response.data.memberId}`);
      })
      .catch(console.log);
  } else {
    next();
  }
}
site.use('/viewthread.php', discuzRedirectHandler);
site.use('/thread-:tid-:extra-:page.html', discuzRedirectHandler);
site.use('/space-uid-:uid.html', discuzRedirectHandler);
site.use('/forum.php', discuzRedirectHandler);
site.use('/home.php', discuzRedirectHandler);

// deal with all those unhandled requests here.
site.use(express.static(path.join(__dirname, './static')));
site.get('*', (isProd || isTest)
  ? (req, res) => {
    render(req, res);
  }
  : (req, res) => {
    readyPromise.then(() => render(req, res));
  }
);

// Establish database connection and start http service
site.listen(9281, /* 'localhost', */() => {
  console.log(`Server started on port ${9281} with ${isProd ? 'production' : (isTest ? 'test' : 'development')} mdoe`);
});

module.exports = site;
