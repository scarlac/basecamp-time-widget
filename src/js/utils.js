function strlimit(str, limit) {
	if(str.length > limit)
		return str.substr(0, limit) + "...";
	else
		return str;
}

function zeropad(no, digits) {
	no = no.toString();
	while(no.length < digits)
		no = '0' + no;
	return no;
}

function len(obj) {
	var length = 0;
	for(var i in obj) {
		if(obj.hasOwnProperty(i))
			length++;
	}
	return length;
}

function roundNumber(num, dec) {
	var result = Math.round(num*Math.pow(10,dec))/Math.pow(10,dec);
	return result;
}

// * enable widget object so browsers don't barf and no need for fail-safe code in widget
function enableBrowserSupport() {
	if(!window.widget) {
		window.widget = {};
		window.widget.preferenceForKey = function(key) {
			var value = cookie(key);
			console.log('reading preference: '+key+'='+value);
			return value;
		}
		window.widget.setPreferenceForKey = function(value, key) {
			console.log('writing preference: '+key+'='+value);
			cookie(key, value);
		}
		window.widget.prepareForTransition = function(id) {
			console.log('preparing for transition on element id: '+id);
		}
		window.widget.performTransition = function() {
			console.log('performing transition animation');
		}
		widget.openURL = function(url) {
			window.open(url, '', '');
		}
	}
}

function cookie(name, value, options) {
    if (typeof value != 'undefined') { // name and value given, set cookie
        options = options || {};
        if (value === null) {
            value = '';
            options.expires = -1;
        }
        var expires = '';
        if (options.expires && (typeof options.expires == 'number' || options.expires.toUTCString)) {
            var date;
            if (typeof options.expires == 'number') {
                date = new Date();
                date.setTime(date.getTime() + (options.expires * 24 * 60 * 60 * 1000));
            } else {
                date = options.expires;
            }
            expires = '; expires=' + date.toUTCString(); // use expires attribute, max-age is not supported by IE
        }
        // CAUTION: Needed to parenthesize options.path and options.domain
        // in the following expressions, otherwise they evaluate to undefined
        // in the packed version for some reason...
        var path = options.path ? '; path=' + (options.path) : '';
        var domain = options.domain ? '; domain=' + (options.domain) : '';
        var secure = options.secure ? '; secure' : '';
        document.cookie = [name, '=', encodeURIComponent(value), expires, path, domain, secure].join('');
    } else { // only name given, get cookie
        var cookieValue = null;
        if (document.cookie && document.cookie != '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = jQuery.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) == (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
}

