default: clean widget

widget: clean
	cp -R src TimeTrack.wdgt
	rm -f TimeTrack.wdgt/css/debug.css

clean:
	rm -rf TimeTrack.wdgt

