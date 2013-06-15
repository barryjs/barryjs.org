var app = angular.module('homepage', ['barry']);

app.factory('fetchCode', function($http) {
  return function get(id, callback) {
    $http({method: "GET", url: '/examples/'+id})
      .success(function (data, status, headers, config) {
        callback(data);
      });
  };
});
app.factory('fetchAnnotation', function (indent) {
  return function get(id) {
    return angular.fromJson(angular.element(document.getElementById(id)).html());
  };
});
app.directive('appSource', function (fetchCode, fetchAnnotation, indent, escape) {
  return {
    terminal: true,
    link: function (scope, element, attrs) {
      var tabs = [],
          panes = [],
          exampleId = element.parents("[barry-example]").attr('barry-example'),
          annotation = fetchAnnotation(exampleId+'.annotation') || {},
          TEMPLATE = {
            'index.html':
            '<!doctype html>\n' +
            '<html ng-app__MODULE__>\n' +
            '  <body>\n' +
            '__BODY__' +
            '    <script src="/js/angular.min.js"></script>\n' +
            '    <script src="/socket.io/socket.io.js"></script>\n' +
            '    <script src="/barry/barry.js"></script>\n' +
            '  </body>\n' +
            '</html>'
          };

      element.css('clear', 'both');

      angular.forEach(attrs.appSource.split(' '), function(filename, index) {
        var id = exampleId.split('_').pop()+"-"+filename.replace(/\W/g, '-');
        tabs.push(
          '<li class="' + (!index ? 'active' : '') + '">' +
          '<a href="#' + id + '" data-toggle="tab">' + filename + '</a>' +
          '</li>'
        );

        fetchCode(exampleId+"/"+filename, function (content) {
          if (filename === "index.html") {
            var head = [];

            content = content.match(/<body[\S\s]*?>([\S\s]*)<\/body>/)[1];

            angular.forEach(attrs.appSource.split(' '), function(tab, index) {
              var filename = tab.split(':')[0],
                  fileType = filename.split(/\./)[1];

              if (index == 0) return;
              if (fileType == 'js') {
                head.push('    <script src="' + filename + '"></script>\n');
              } else if (fileType == 'css') {
                head.push('    <link rel="stylesheet" href="' + filename + '">\n');
              }
            });
            content = TEMPLATE['index.html'].
              replace('__MODULE__', '="' + (attrs.module ? attrs.module : 'app') + '"').
              replace('__HEAD__', head.join('')).
              replace('__BODY__', indent(content, 4));
          } else if (filename === "server.js") {
            content = indent(content.split('\n').slice(1, -2).join('\n'));
            content = "var barry = require('barry-io').listen(80);\n"+content;
          } else {
            content = indent(content);
          }

          content = escape(content);

          var el = $('<code></code>')
                .appendTo(element.find("#"+id+" > pre"))
                .html(content)
                .attr('id', id+"-code");
          Prism.highlightElement(el[0]);

          content = el.html();

          var popovers = {},
              counter = 0;

          angular.forEach(annotation[filename], function(text, key) {
            var regexp = new RegExp('(\\W|^)(' + key.replace(/([\W\-])/g, '\\$1') + ')(\\W|$)');
            content = content.replace(regexp, function(_, before, token, after) {
              var token = "__" + (counter++) + "__";
              popovers[token] =
                '<code class="nocode" rel="popover" title="' + escape(key) +
                '" data-content="' + escape(text) + '"><span>' + escape(key) + '</span></code>';
              return before + token + after;
            });
          });

          angular.forEach(popovers, function(text, token) {
            content = content.replace(token, text);
          });

          el.html(content);

          el.find('[rel=popover]').popover({
            container: 'body',
            html: true,
            trigger: 'hover',
            placement: 'top'
          });
        });

        var lang;
        switch (filename.split('.').pop()) {
        case 'js':
          lang = 'javascript';
          break;
        case 'html':
        default:
          lang = 'markup';
        }
        panes.push(
          '<div class="tab-pane' +
            (!index ? ' active' : '') +
            ' language-'+lang+ '" id="' + id + '">' +
          '<pre></pre>' +
          '</div>');
      });

      element.html(
        '<div class="tabbable">' +
          '<ul class="nav nav-tabs">' +
          tabs.join('') +
          '</ul>' +
          '<div class="tab-content">' +
          panes.join('') +
          '</div>' +
          '</div>');
      //element.find('[rel=popover]').popover().pulse();
    }
  };
});

app.directive('appRun', function(fetchCode, $templateCache, $browser, $barry) {
  return {
    terminal: true,
    link: function(scope, element, attrs) {
      var modules = [];

      var exampleId = element.parents("[barry-example]").attr('barry-example');

      modules.push(function($provide, $locationProvider) {
        $provide.value('$templateCache', {
          get: function(key) {
            var value = $templateCache.get(key);
            if (value) {
              value = value.replace(/\#\//mg, '/');
            }
            return value;
          }
        });
        $provide.value('$anchorScroll', angular.noop);
        $provide.value('$browser', $browser);
        $provide.value('$barry', $barry);
        $locationProvider.html5Mode(true);
        $locationProvider.hashPrefix('!');
      });
      if (attrs.module) {
        modules.push(attrs.module);
      }

      fetchCode(exampleId+"/index.html", function(content) {
        content = content.match(/<body[\S\s]*?>([\S\s]*)<\/body>/)[1];
        element.html(content);
        element.bind('click', function(event) {
          if (event.target.attributes.getNamedItem('ng-click')) {
            event.preventDefault();
          }
        });
        angular.bootstrap(element, modules);
      });
    }
  };
});
app.value('indent', function(text, spaces) {
  if (!text) return text;
  var lines = text.split(/\r?\n/);
  var prefix = '      '.substr(0, spaces || 0);
  var i;

  // remove any leading blank lines
  while (lines.length && lines[0].match(/^\s*$/)) lines.shift();
  // remove any trailing blank lines
  while (lines.length && lines[lines.length - 1].match(/^\s*$/)) lines.pop();
  var minIndent = 999;
  for (i = 0; i < lines.length; i++) {
    var line = lines[0];
    var indent = line.match(/^\s*/)[0];
    if (indent !== line && indent.length < minIndent) {
      minIndent = indent.length;
    }
  }

  for (i = 0; i < lines.length; i++) {
    lines[i] = prefix + lines[i].substring(minIndent);
  }
  lines.push('');
  return lines.join('\n');
});
app.value('escape', function(text) {
  return text.replace(/\&/g, '&amp;').replace(/\</g, '&lt;').replace(/\>/g, '&gt;').replace(/"/g, '&quot;');
});

