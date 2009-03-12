var gDoneButton;
var gInfoButton;

function setup() {
	$("#infoButton").text("i").click(showPrefs);
	$("#doneButton").text("Tilbage").click(hidePrefs);
}

function showPrefs() {
	var front = document.getElementById("front");
	var back = document.getElementById("back");
	if (window.widget)
		widget.prepareForTransition("ToBack");
	
	front.style.display="none";
	back.style.display="block";
	
	if (window.widget)
		setTimeout('widget.performTransition();', 0);
	
	$("#login_username").get(0).focus();
}

function hidePrefs() {
	var front = document.getElementById("front");
	var back = document.getElementById("back");
	
	if (window.widget)
		widget.prepareForTransition("ToFront");
	
	back.style.display="none";
	front.style.display="block";
	
	if (window.widget)
		setTimeout('widget.performTransition();', 0);
}

var projects = {};
var companies = {};
function dotest() {
	// * set externally in localsettings.js
	var username=bc_username;
	var password=bc_password;
	var baseURL = bc_base_url;

	var projectsURL = baseURL + "/projects.xml";
	
	$.ajaxSetup({
		username: username,
		password: password
	});
	
	pullProjects(); // * Will also pull project todos, etc.
}

function pullProjects() {
	$.ajax(feedURL, parseProjects);
}

function pullProjectTodos() {
	$.ajax(feedURL, parseProjects);
}

function parseProjects(projectsNode) {
	window.projectsNode = projectsNode;
	$(projectsNode).find("projects project").each(function(i) {
		var t = $(this);
		var id = t.find("id").text();
		projects[id] = {
			id: id,
			name: t.find("name").text(),
			status: t.find("status").text()
		}
	});
	pullProjectTodos();
	alert('got response from server: ' + $.param(projects));
}

function parseProject(projectNode) {
	
}

