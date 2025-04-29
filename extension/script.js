// Listen for messages sent from the iFrame
var eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
var eventer = window[eventMethod];
var messageEvent = eventMethod == "attachEvent" ? "onmessage" : "message";

eventer(messageEvent,function(e) {
	// If the message is a resize frame request
	if (e.data.indexOf('resize::') != -1) {
		var height = e.data.replace('resize::', '');
		document.getElementById('content').style.height = height+'px';
	}
} ,false);