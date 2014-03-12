var INLINE_LINK = /(\S+)(?:\s+(.+))?/;
var log = require('winston');

module.exports = {
  name: 'link',
  description: 'Process inline link tags (of the form {@link some/uri Some Title}), replacing them with HTML anchors',
  handlerFactory: function(partialNames) {

    return function handleLinkTags(doc, tagName, tagDescription) {

      // Parse out the uri and title
      return tagDescription.replace(INLINE_LINK, function(match, uri, title) {

        var linkInfo = partialNames.getLink(uri, title, doc);

        if ( !linkInfo.valid ) {
          log.warn(linkInfo.error, 'in', doc.relativePath + '#' + doc.name);
          linkInfo.title = 'TODO:' + linkInfo.title;
        }

        return '<a href="/docs/' + process.env.DOC_VERSION + '/' + linkInfo.url + '">' + linkInfo.title + '</a>';
      });
    };
  }
};
