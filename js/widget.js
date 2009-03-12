var gDoneButton = null;
var gInfoButton = null;
var allProjects = null;
var allCompanies = null;
var ajaxOptions = {
	type: 'GET',
	username: '',
	password: ''
};

function setup() {
	$("#infoButton").text("i").click(showPrefs);
	$("#doneButton").text("Tilbage").click(hidePrefs);
	
	// * set externally in localsettings.js
	ajaxOptions.username = bc_username;
	ajaxOptions.password = bc_password;
	
	allProjects = {};
	allCompanies = {};
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
	
	if(window.widget)
		setTimeout('widget.performTransition();', 0);
}

function loadStuff() {
	pullProjects(); // * Will also pull project todos, etc.
}

function pullProjects() {
	var projectsURL = bc_base_url + "/projects.xml";
	var opts = ajaxOptions;
	
	console.log('pulling projects data from ' + projectsURL);

	opts.url = projectsURL;
	opts.success = parseProjects;
	$.ajax(opts);
}

function pullProjectTodos(id) {
	var todoURL = bc_base_url + "/projects/"+id+".xml";
	var opts = ajaxOptions;
	
	console.log('pulling project todos from ' + todoURL);

	opts.url = todoURL;
	opts.success = parseProjectTodos;
	$.ajax(opts);
}

function parseProjects(projectsNode) {
	console.log('parsing projects data');
	
	allProjects = {};
	allCompanies = {};
	$(projectsNode).find("projects > project").each(function(i) {
		var t = $(this);
		
		var id = t.find("> id").text();
		var name = t.find("> name").text();
		var prj = new Project(id, name);
		
		var c_id = t.find("> company > id").text();
		var c_name = t.find("> company > name").text();
		var cmp = new Company(c_id, c_name);
		
		prj.company = cmp;
		
		allProjects[prj.id] = prj;
		allCompanies[cmp.id] = cmp;
	});
	
	// * setup the drop down
	console.log('setting up projects drop down');
	$("#projects").html('<option value="">- Select project -</option>');
	for(var i in allCompanies) {
		var cmp = allCompanies[i];
		var projects = cmp.getProjects();
		$("#projects").append('<option value="" disabled="disabled">'+cmp.name+'</option>');
		for(var i in projects) {
			var prj = projects[i];
			$("#projects").append('<option value="'+prj.id+'">&nbsp;&nbsp;'+prj.name+'</option>');
		}
	}
	
	pullProjectTodos();
}

function parseProjectTodos(rootNode) {
	console.log('parsing project todos');
}

Project = function(id, name) {
	this.id = id;
	this.name = name;
}

Company = function(id, name) {
	this.id = id;
	this.name = name;
}

Company.prototype.getProjects = function() {
	var projects = {};
	
	for(var i in allProjects) {
		var prj = allProjects[i];
		if(prj.company.id == this.id) {
			projects[prj.id] = prj;
		}
	}
	
	return projects;
}

/*
<projects type="array">
  <project>
    <announcement nil="true"></announcement>
    <created-on type="date">2009-01-05</created-on>
    <id type="integer">42</id>
    <last-changed-on type="datetime">2009-03-09T09:24:34Z</last-changed-on>
    <name>My project name</name>
    <show-announcement type="boolean">false</show-announcement>
    <show-writeboards type="boolean">true</show-writeboards>
    <start-page>log</start-page>
    <status>active</status>
    <company>
      <id type="integer">1234567</id>
      <name>Simcorp</name>
    </company>
  </project>
*/
