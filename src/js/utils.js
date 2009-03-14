function strlimit(str, limit) {
	if(str.length > limit)
		return str.substr(0, limit) + "...";
	else
		return str;
}

function zerofill(no, digits) {
	if(no.toString().length < digits) {
		no = '0' + no;
		return zerofill(no, digits);
	} else {
		return no;
	}
}

// * enable widget object so browsers don't barf and no need for fail-safe code in widget
function enableBrowserSupport() {
	if(!window.widget) {
		window.widget = {};
		window.widget.preferenceForKey = function(key) {
			console.log('reading preference: '+key);
			return cookie(key);
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

// * Timer class {{{
Timer = function() {
	this.startTime = 0;
	this.stopTime = 0;
	this.elapsed = 0; // * elapsed number of ms for current timing
	this.totalElapsed = 0; // * elapsed number of ms in total
	this.started = false;
	this.listener = null;
	this.tickResolution = 1000; // * how long between each tick in milliseconds
	this.tickInterval = null;
	
	// * pretty static vars
	this.onehour = 1000 * 60 * 60;
	this.onemin  = 1000 * 60;
	this.onesec  = 1000;
}
Timer.prototype.start = function() {
	if(!this.started) {
		this.startTime = new Date().getTime();
		this.stopTime = 0;
		this.started = true;
		this.tickInterval = setInterval(delegate(this, this.onTick), this.tickResolution);
	}
}
Timer.prototype.stop = function() {
	if(this.started) {
		this.stopTime = new Date().getTime();
		this.elapsed = this.stopTime - this.startTime;
		this.totalElapsed += this.elapsed;
		this.started = false;
		if(this.tickInterval != null)
			clearInterval(this.tickInterval);
	}
	return this.getElapsed();
}
Timer.prototype.reset = function() {
	this.elapsed = 0;
	this.totalElapsed = 0;
	// * if timer is running, reset it to current time
	this.startTime = new Date().getTime();
	this.stopTime = this.startTime;
}
Timer.prototype.restart = function() {
	this.stop();
	this.reset();
	this.start();
}
Timer.prototype.getElapsed = function() {
	// * if timer is stopped, use that date, else use now
	var elapsed = 0;
	if(this.started)
		elapsed = new Date().getTime() - this.startTime;
	else
		elapsed = this.stopTime - this.startTime;
	
	elapsed = elapsed + this.totalElapsed;
	
	var hours = parseInt(elapsed / this.onehour);
	elapsed %= this.onehour;
	var mins = parseInt(elapsed / this.onemin);
	elapsed %= this.onemin;
	var secs = parseInt(elapsed / this.onesec);
	
	return {
		hours: hours,
		minutes: mins,
		seconds: secs
	};
}
Timer.prototype.setElapsed = function(hours, mins, secs) {
	this.reset();
	this.totalElapsed = 0;
	this.totalElapsed += hours * this.onehour;
	this.totalElapsed += mins  * this.onemin;
	this.totalElapsed += secs  * this.onesec;
}
Timer.prototype.toString = function() {
	var e = this.getElapsed();
	return zerofill(e.hours,2) + ":" + zerofill(e.minutes,2) + ":" + zerofill(e.seconds,2);
}
Timer.prototype.setListener = function(listener) {
	this.listener = listener;
}
// * triggered every <resolution> ms
Timer.prototype.onTick = function() {
	if(this.listener != null) {
		this.listener(this);
	}
}
// }}}

var delegate = function(that, method) {
	return function() { return method.call(that) }
};
// * shallow copy only
cloneObject = function(t) {
	var o = {};
	for(var i in t) {
		o[i] = t[i];
	}
	return o;
}

