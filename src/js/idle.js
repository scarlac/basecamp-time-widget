function idlePoll() {
	if(widget && widget.system) {
		var idleSeconds = parseInt(widget.system("ioreg -c IOHIDSystem | perl -ane 'if (/Idle/) {$idle=(pop @F)/1000000000; print $idle,\"\";last}' ", null).outputString);
		
		if(idleSeconds > _idleMinutes * 60) {
			if(!_isIdle) {
				_isIdle = true;
				if(onEnterIdle)
					onEnterIdle();
			}
		} else {
			if(_isIdle) {
				_isIdle = false;
				if(onExitIdle)
					onExitIdle();
			}
		}
	}
}

_isIdle = false;
_idleMinutes = 3;
setInterval(idlePoll, 5000) // start polling

