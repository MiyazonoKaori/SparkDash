
var URL = require('url'),
sys = require('sys'),
crypto = require('crypto');

const verifierSet = 'abcdefghijklmnopqrstuvwxyz0123456789';

var generateKeypair = function(generatorKey, string, algorithm) {
    algorithm = algorithm || 'sha256';
    var key = crypto.createHmac('sha1', generatorKey).update(Date.now().toString()).digest('base64')
        .replace(/\=/g, '.').replace(/\//g, '-').replace(/\+/g, '_');
    var secret = crypto.createHmac(algorithm, key).update(string).digest('base64')
        .replace(/\=/g, '.').replace(/\//g, '-').replace(/\+/g, '_');
    var pair = {key: key, secret: secret};
		//console.log(sys.inspect(pair));
    return pair;
}
var generateVerifier = function (size) {
    var verifier = '';
    size = size || 20;
    for (var i = 0; i < size; i++) {
        verifier += verifierSet[Math.floor(Math.random()*verifierSet.length)];
    }
    return verifier;
}
var generateRequestToken = function (oauthParams, consumer, algorithm) {
    var tok = generateKeypair(oauthParams.oauth_nonce, consumer.key + oauthParams.oauth_signature, algorithm);
    tok.nonce = oauthParams.oauth_nonce;
    tok.timestamp = oauthParams.oauth_timestamp;
    tok.consumer = consumer.key;
    tok.verifier = generateVerifier();
    return tok;
}
// add userid to access token
var generateAccessToken = function(requestToken, algorithm) {
    var tok = generateKeypair(requestToken.consumer.secret,
                              requestToken.consumer.name + requestToken.secret +
                              requestToken.consumer.callbackUrl, algorithm);
    return tok;
}

var encodeData = function (data) {
    return data === null || data === '' ? "" :
        // replace symbols ! ' ( ) *
        encodeURIComponent(data).replace(/\!/g, "%21").replace(/\'/g, "%27")
                 .replace(/\(/g, "%28").replace(/\)/g, "%29").replace(/\*/g, "%2A");
}

var decodeData = function (data) {
    return decodeURIComponent( data !== null ? data.replace(/\+/g, " ") : data);
}

exports.signParams = function signParams(method, url, signType, key, params) {
    for (var i in params) {
        if (params[i][0] === 'oauth_signature') {
            params.splice(i,1);
            break;
        }
    }
    url = encodeData(url)       // todo normalize url
    var signatureBase = method.toUpperCase() + '&' + url + '&' +
        encodeData(params.map(function (p) { return p.join('='); }).join('&'));

		console.log('base1:  '+signatureBase);
		
    return crypto.createHmac('sha1', key).update(signatureBase).digest('base64');
}

exports.sortParams = function sortParams(params) {
    params.sort(function (a, b) {
        if ( a[0] === b[0] ) {
            return a[1] < b[1] ? -1 : 1;
        }
        else {
            return a[0] < b[0] ? -1: 1;
        }});
    return params;
}


exports.checkAccess  = function(req, store, fn) {
};

exports.generateKeypair = generateKeypair;
exports.encodeData = encodeData;
exports.decodeData = decodeData;
exports.generateRequestToken = generateRequestToken;
exports.generateAccessToken = generateAccessToken;
