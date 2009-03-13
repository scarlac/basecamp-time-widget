default: clean widget

widget: clean
	cp -R src TimeTrack.wdgt

clean:
	rm -rf TimeTrack.wdgt

