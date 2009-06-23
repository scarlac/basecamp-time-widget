Idle = function() {
	this.idleMinutes = 0.1;
	this.isIdle = false;
}

Idle.prototype.poll = function() {
	if(widget && widget.system) {
		var idleSeconds = parseInt(widget.system("ioreg -c IOHIDSystem | perl -ane 'if (/Idle/) {$idle=(pop @F)/1000000000; print $idle,\"\";last}' ", null).outputString);
		
		if(idleSeconds > this.idleMinutes * 60) {
			if(!this.isIdle) {
				this.isIdle = true;
				if(onEnterIdle)
					onEnterIdle();
			}
		} else {
			if(this.isIdle) {
				this.isIdle = false;
				if(onExitIdle)
					onExitIdle();
			}
		}
	}
}

idle = new Idle();
setInterval(function() { idle.poll() }, 5000) // start polling

