var gDoneButton = null;
var gInfoButton = null;
var allProjects = null;
var allCompanies = null;
var bc_username = null;
var bc_password = null;
var bc_base_url = null;
var ajaxOptions = {
	type: 'GET',
	username: '',
	password: '',
	contentType: 'application/xml'
};
monthNames = [
	{ short: 'Jan', long: 'January'},
	{ short: 'Feb', long: 'Febuary'},
	{ short: 'Mar', long: 'March'},
	{ short: 'Apr', long: 'April'},
	{ short: 'May', long: 'May'},
	{ short: 'Jun', long: 'June'},
	{ short: 'Jul', long: 'July'},
	{ short: 'Aug', long: 'August'},
	{ short: 'Sep', long: 'September'},
	{ short: 'Oct', long: 'October'},
	{ short: 'Nov', long: 'November'},
	{ short: 'Dec', long: 'December'}
];

function setup() {
	enableBrowserSupport();
	
	gDoneButton = new AppleGlassButton(document.getElementById("done"), "Back", hidePrefs);
	gInfoButton = new AppleInfoButton(document.getElementById("info"), document.getElementById("front"), "white", "white", showPrefs);
	
	allProjects = {};
	allCompanies = {};
	
	// * load settings {{{
	bc_username = widget.preferenceForKey("username");
	bc_password = widget.preferenceForKey("password");
	bc_base_url = widget.preferenceForKey("base_url");
	
	$("#bc_username").val(bc_username);
	$("#bc_password").val(bc_password);
	$("#bc_base_url").val(bc_base_url);
	
	ajaxOptions.username = bc_username;
	ajaxOptions.password = bc_password;
	// }}}
	
	// * ui hooks {{{
	$("#projects").change(updateProjectTodos);
	$("#reportbtn").click(reportTime);
	$("#login_form").submit(submitLogin);
	// }}}
	
	// * set-up load indicator {{{
	$("#loadindicator").hide();
	$("#loadindicator").ajaxStart(function() { $(this).show(); });
	$("#loadindicator").ajaxStop(function() { $(this).hide(); });
	// }}}
	
	// * generate data for date-drop downs {{{
	// * months
	$("#reportdate_m").html("");
	for(var m = 0; m < 12; m++)
		$("#reportdate_m").append('<option value="' + m + '">' + monthNames[m].short + '</option>');
	
	// * days
	$("#reportdate_d").html("");
	for(var d = 1; d <= 31; d++)
		$("#reportdate_d").append('<option value="' + d + '">' + d + '</option>');
	
	// * years
	$("#reportdate_y").html("");
	var today = new Date();
	var pastYears = 1; // * how many years back in the drop down
	var futureYears = 1; // * how many years forth in the drop down
	for(var y = today.getFullYear() - pastYears; y <= today.getFullYear() + futureYears; y++)
		$("#reportdate_y").append('<option value="' + y + '">' + y + '</option>');
	// }}}
}

function showPrefs() {
	var front = document.getElementById("front");
	var back = document.getElementById("back");
	
	widget.prepareForTransition("ToBack");
	
	front.style.display="none";
	back.style.display="block";
	
	setTimeout('widget.performTransition();', 0);
}

function hidePrefs() {
	var front = document.getElementById("front");
	var back = document.getElementById("back");
	
	widget.prepareForTransition("ToFront");
	
	back.style.display="none";
	front.style.display="block";
	
	setTimeout('widget.performTransition();', 0);
}

// * Temporary debugging functions {{{
function loadProjects() {
	pullProjects();
}

function loadTodos() {
	var prj_id = $("#projects").val();
	pullProjectTodoLists(prj_id);
}
// }}}

// * Data-pulling/ajax functions {{{

function pullProjects() {
	var projectsURL = bc_base_url + "/projects.xml";
	var opts = ajaxOptions;
	
	console.log('pulling projects data from login');

	opts.url = projectsURL;
	opts.success = function(root) { parseProjects(root); };
	$.ajax(opts);
}

function pullProjectTodoLists(project_id) {
	var todoURL = bc_base_url + "/projects/"+project_id+"/todo_lists.xml";
	var opts = ajaxOptions;
	
	console.log('pulling project todos from project ' + project_id);
	
	opts.url = todoURL;
	opts.success = function(root) { parseProjectTodoLists(root, project_id); };
	$.ajax(opts);
}

function pullTodoItems(project_id, list_id) {
	var listURL = bc_base_url + "/todo_lists/"+list_id+"/todo_items.xml";
	var opts = ajaxOptions;
	
	console.log('pulling project todos from project ' + project_id + ', list ' + list_id);

	opts.url = listURL;
	opts.success = function(root) { parseTodoItems(root, project_id, list_id); };
	$.ajax(opts);
}

// }}}

// * Data parsing functions {{{

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
}

function parseProjectTodoLists(todoNode) {
	console.log('parsing project todos');
	
	todolists = {};
	$(todoNode).find("todo-lists > todo-list").each(function(i) {
		var t = $(this);
		
		var id = t.find("> id").text();
		var name = t.find("> name").text();
		var complete = (t.find("> complete").text().toLowerCase() == 'true');
		var prjId = t.find("> project-id").text();
		var list = new TodoList(id, name, complete, prjId);
		
		todolists[list.id] = list;
		
		// * add the todolist to the specific project
		var prj = allProjects[prjId];
		if(prj != null)
			prj.todolists[list.id] = list;
	});
	
	console.log('pulling todo items');
	for(var i in todolists) {
		var list = todolists[i];
		// * only pull lists with content
		if(list.complete == false)
			pullTodoItems(list.projectId, list.id);
	}
}

function parseTodoItems(itemsNode, project_id, list_id) {
	console.log('parsing todo items');
	
	todos = {};
	$(itemsNode).find("todo-items > todo-item").each(function(i) {
		var t = $(this);
		
		var id = t.find("> id").text();
		var content = t.find("> content").text();
		var completed = (t.find("> completed").text().toLowerCase() == 'true');
		var item = new TodoItem(id, content, completed);
		
		var prj = allProjects[project_id];
		if(prj != null)
			prj.todolists[list_id].items[id] = item;
	});
	updateProjectTodos();
}

// }}}

function updateProjectTodos() {
	console.log('updating todo lists drop down');
	
	// * setup the drop down
	var projectId = $("#projects").val();
	var prj = allProjects[projectId];
	
	if(prj != null) {
		var todolists = prj.todolists;
		$("#todos").html('<option value="">- Select todo -</option>');
		for(var i in todolists) {
			var list = todolists[i];
			var displayName = strlimit(list.name, 30) + (list.complete ? ' (complete)' : '');
			$("#todos").append('<option value="" disabled="disabled">'+displayName+'</option>');
			
			var items = list.items;
			for(var i in items) {
				var item = items[i];
				var displayName = strlimit(item.content, 30) + (item.completed ? ' (complete)' : '');
				$("#todos").append('<option value="'+item.id+'">&nbsp;&nbsp;'+displayName+'</option>');
			}
		}
	}
}

function reportTime() {
	var todoItemId = $("#todos").val();
	var hours = $("#reporthours").val();
	
	var timeURL = bc_base_url + "/todo_items/" + todoItemId + "/time_entries.xml";
	var opts = ajaxOptions;
	
	console.log('reporting time on item ' + todoItemId);
	
	var d = new Date();
	var date = $("#reportdate_y").val() + "-" + zerofill(parseInt($("#reportdate_m").val())+1, 2) + "-" + zerofill($("#reportdate_d").val(), 2);
	var data = '<time-entry>';
	data += '<person-id>3310494</person-id>';
	data += '<date>' + date + '</date>';
	data += '<hours>' + hours + '</hours>';
	data += '<description>Lorem ipsum, widget time registration</description>';
	data += '</time-entry>';
	opts.data = data;
	opts.processData = false;
	
	opts.type = 'POST';
	opts.url = timeURL;
	opts.success = function(root) { /* Returns HTTP status code 201 (Created) on success, with the Location header set to the URL of the new time entry. The integer ID of the entry may be extracted from that URL*/ };
	$.ajax(opts);
}

function submitLogin() {
	var username = $("#bc_username").val();
	var password = $("#bc_password").val();
	var base_url = $("#bc_base_url").val();
	
	if(username && password && base_url) {
		widget.setPreferenceForKey(username, "username");
		widget.setPreferenceForKey(password, "password");
		widget.setPreferenceForKey(base_url, "base_url");
		bc_username = username;
		bc_password = password;
		bc_base_url = base_url;
		pullProjects();
	}
	
	return false;
}

// * Classes, Project {{{
Project = function(id, name) {
	this.id = id;
	this.name = name;
	this.todolists = {};
}

Project.prototype.getTodos = function() {
	var todos = {};
	return todos;
}
// }}}

// * Classes, Company {{{
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
// }}}

// * Classes, TodoItem and TodoList {{{
TodoList = function(id, name, complete, projectId) {
	this.id = id;
	this.name = name;
	this.complete = complete;
	this.projectId = projectId;
	this.items = {};
}

TodoItem = function(id, content, completed) {
	this.id = id;
	this.content = content;
	this.completed = completed;
}
// }}}

/*
PROJECTS:
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
  
TODOS:
<todo-lists type="array">
  <todo-list>
    <completed-count type="integer">0</completed-count>
    <description></description>
    <id type="integer">123456</id>
    <milestone-id type="integer" nil="true"></milestone-id>
    <name>Do stuff</name>
    <position type="integer">1</position>
    <private type="boolean">true</private>
    <project-id type="integer">123456</project-id>
    <tracked type="boolean">false</tracked>
    <uncompleted-count type="integer">1</uncompleted-count>
    <complete>false</complete>
  </todo-list>
  
*/
