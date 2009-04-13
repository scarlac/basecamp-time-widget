var gDoneButton = null;
var gInfoButton = null;
var allProjects = null; // * Array of all collected projects
var allCompanies = null; // * Array of all collected companies

var BC_USERNAME = null; // * Basecamp username
var BC_PASSWORD = null; // * Basecamp password
var BC_BASE_URL = null; // * Basecamp base url
var HOUR_PRECISION = 30; // * hour precision, specified in minutes

var globalTimer = null; // * Stopwatch object
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
	
	gDoneButton = new AppleGlassButton(document.getElementById("done"), "Back", function() { showFront() });
	gInfoButton = new AppleInfoButton(document.getElementById("info"), document.getElementById("front"), "white", "white", function() { showBack() });
	
	allProjects = {};
	allCompanies = {};
	globalTimer = new Stopwatch(updateTimer, 500);
	
	// * load settings {{{
	BC_USERNAME = widget.preferenceForKey("username");
	BC_PASSWORD = widget.preferenceForKey("password");
	BC_BASE_URL = widget.preferenceForKey("base_url");
	BC_USER_ID  = widget.preferenceForKey("user_id");
	HOUR_PRECISION = widget.preferenceForKey("hour_precision");
	if(HOUR_PRECISION == null) HOUR_PRECISION = 30; // * 30 minutes of default rounding (1/2 hour)
	if(BC_USER_ID == null || BC_USER_ID == 0) BC_USER_ID = 0;
	BC_USER_ID = parseInt(BC_USER_ID); // * ensure it's an int when it gets read from settings
	$("#your_user_id").text(BC_USER_ID);
	
	ajaxOptions.username = BC_USERNAME;
	ajaxOptions.password = BC_PASSWORD;
	// }}}
	
	// * set-up load indicator {{{
	$(".loadindicator").hide();
	$(".loadindicator").ajaxStart(function() { $(this).show(); });
	$(".loadindicator").ajaxStop(function() { $(this).hide(); });
	// }}}
	
	// * Generate data for date-drop downs {{{
	var today = new Date();
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
	var pastYears = 1; // * how many years back in the drop down
	var futureYears = 1; // * how many years forth in the drop down
	for(var y = today.getFullYear() - pastYears; y <= today.getFullYear() + futureYears; y++)
		$("#reportdate_y").append('<option value="' + y + '">' + y + '</option>');
	// }}}
	
	// * UI defaults {{{
	$("#bc_username").val(BC_USERNAME);
	$("#bc_password").val(BC_PASSWORD);
	$("#bc_base_url").val(BC_BASE_URL);
	
	$("#reportdate_d").val(today.getDate());
	$("#reportdate_m").val(today.getMonth());
	$("#reportdate_y").val(today.getFullYear());
	$("#roundtime").val(HOUR_PRECISION);
	//$("#reportcontainer").hide();
	$("#reportdate").hide();
	$("#show_project").hide();
	$("#done").hide(); // * initially hide until user logs in
	//showBack(false);
	// }}}
	
	// * ui hooks {{{
	$("#projects").change(changeProject);
	$("#login_form").submit(submitLogin);
	$("#starttime").click(startTimer);
	$("#stoptime").click(stopTimer).attr("disabled", true);
	$("#reportbtn").click(reportTime);
	$("#reporthours").change(function(e) { changeTime() });
	$("#reporthours").keydown(keyDownTime);
	$("#roundtime").change(changeRoundTime);
	$("#show_project").click(openProjectURL);
	$("#reportdate_toggle").click(function() { $("#reportdate").fadeToggle(200) });
	// }}}
}

function showBack(animate) {
	if(animate == undefined)
		animate = true;
	
	var front = document.getElementById("front");
	var back = document.getElementById("back");
	
	if(animate)
		widget.prepareForTransition("ToBack");
	
	front.style.display="none";
	back.style.display="block";
	
	if(animate)
		setTimeout('widget.performTransition();', 0);
}

function showFront(animate) {
	if(animate == undefined)
		animate = true;
	
	var front = document.getElementById("front");
	var back = document.getElementById("back");
	
	if(animate)
		widget.prepareForTransition("ToFront");
	
	back.style.display="none";
	front.style.display="block";
	
	if(animate)
		setTimeout('widget.performTransition();', 0);
}

// * Temporary debugging functions {{{
function loadTodos() {
	var prj_id = $("#projects").val();
	pullProjectTodoLists(prj_id);
}
// }}}

// * Data-pulling/ajax functions {{{

function pullProjects(callback) {
	var projectsURL = BC_BASE_URL + "/projects.xml";
	var opts = $.extend({}, ajaxOptions);
	
	console.log('pulling projects data from login');

	opts.url = projectsURL;
	opts.success = function(root) { parseProjects(root); callback(); };
	$.ajax(opts);
}

function pullProjectTodoLists(project_id) {
	var todoURL = BC_BASE_URL + "/projects/"+project_id+"/todo_lists.xml";
	var opts = $.extend({}, ajaxOptions);
	
	console.log('pulling project todos from project ' + project_id);
	
	opts.url = todoURL;
	opts.success = function(root) { parseProjectTodoLists(root, project_id); };
	$.ajax(opts);
}

function pullTodoItems(project_id, list_id) {
	var listURL = BC_BASE_URL + "/todo_lists/"+list_id+"/todo_items.xml";
	var opts = $.extend({}, ajaxOptions);
	
	console.log('pulling project todos from project ' + project_id + ', list ' + list_id);

	opts.url = listURL;
	opts.success = function(root) { parseTodoItems(root, project_id, list_id); };
	$.ajax(opts);
}

function pullUserId(callback) {
	// * pulling the users id requires some hacks. They are moved to an external file.
	getCategories(callback);
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
		if(list.complete == false) {
			pullTodoItems(list.projectId, list.id);
		}
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
		if(prj != null) {
			//console.log('adding item '+id+' to list '+list_id);
			prj.todolists[list_id].items[id] = item;
		}
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
		$("#todos").html('<option value="">- Select To-Do -</option>');
		for(var i in todolists) {
			var list = todolists[i];
			// * ignore complete lists
			if(!list.complete) {
				var displayName = strlimit(list.name, 40);
				$("#todos").append('<option value="" disabled="disabled">'+displayName+'</option>');
				
				var items = list.items;
				for(var i in items) {
					var item = items[i];
					if(item.completed)
						continue;
					var displayName = strlimit(item.content, 40) + (item.completed ? ' (complete)' : '');
					$("#todos").append('<option value="'+item.id+'">&nbsp;&nbsp;'+displayName+'</option>');
				}
			}
		}
	}
}

// * Changes to the selected project (may fetch nescessary data)
function changeProject() {
	var projectId = $("#projects").val();
	var prj = allProjects[projectId];
	
	$("#reportcontainer").hide();
	$("#show_project").hide();
	if(prj != null) {
		if(len(prj.todolists) > 0) {
			updateProjectTodos();
		} else {
			pullProjectTodoLists(prj.id);
		}
		$("#reportcontainer").show();
		$("#show_project").show();
	}
}

function reportTime() {
	var hours = $("#reporthours").val();
	var description = $("#reportdescription").val();
	var todoItemId = parseInt($("#todos").val());
	var projectId = parseInt($("#projects").val());
	var opts = $.extend({}, ajaxOptions);
	var timeURL = null;
	
	if(todoItemId > 0) {
		timeURL = BC_BASE_URL + "/todo_items/" + todoItemId + "/time_entries.xml";
		console.log('reporting time on to-do ' + todoItemId);
	} else {
		var projectId = 
		timeURL = BC_BASE_URL + "/projects/" + projectId + "/time_entries.xml";
		console.log('reporting time on project ' + projectId);
	}
	
	var d = new Date();
	var date = $("#reportdate_y").val() + "-" + zeropad(parseInt($("#reportdate_m").val())+1, 2) + "-" + zeropad($("#reportdate_d").val(), 2);
	var data = '<time-entry>';
	data += '<person-id>'+BC_USER_ID+'</person-id>';
	data += '<date>' + date + '</date>';
	data += '<hours>' + hours + '</hours>';
	data += '<description>' + description + '</description>';
	data += '</time-entry>';
	opts.data = data;
	opts.processData = false;
	
	opts.type = 'POST';
	opts.url = timeURL;
	opts.success = function(root) { /* Returns HTTP status code 201 (Created) on success, with the Location header set to the URL of the new time entry. The integer ID of the entry may be extracted from that URL*/ };
	$.ajax(opts);
}

function submitLogin() {
	try
	{
		var username = $("#bc_username").val();
		var password = $("#bc_password").val();
		var base_url = $("#bc_base_url").val();
		
		// * todo: make some better validation, e.g. url-validation
		if(validateLoginForm()) {
			var usernameChanged = true; // * assume the worst
			if(BC_USERNAME != null)
				usernameChanged = (username.toLowerCase() != BC_USERNAME.toLowerCase());
			
			widget.setPreferenceForKey(username, "username");
			widget.setPreferenceForKey(password, "password");
			widget.setPreferenceForKey(base_url, "base_url");
			BC_USERNAME = username;
			BC_PASSWORD = password;
			BC_BASE_URL = base_url;
			ajaxOptions.username = BC_USERNAME;
			ajaxOptions.password = BC_PASSWORD;
			
			pullProjects(function() {
				function enableFront() {
					$("#done").show();
					showFront();
					$("#your_user_id").text(BC_USER_ID);
				}
				
				// * only pull user id if we haven't got it
				// * else: just show the front now
				if(usernameChanged || BC_USER_ID == 0) {
					pullUserId(enableFront);
				} else {
					enableFront();
				}
			});
		}
	} catch(e) {
		alert(e.message);
	}
	
	return false;
}

// * Validates and sanitizes the form data
function validateLoginForm() {
	var success = true;
	var username = $("#bc_username").removeClass("error").val();
	var password = $("#bc_password").removeClass("error").val();
	var base_url = $("#bc_base_url").removeClass("error").val();
	
	if(username.length == 0) {
		$("#bc_username").addClass("error");
		success = false;
	}
	if(password.length == 0) {
		$("#bc_password").addClass("error");
		success = false;
	}
	var isURL = /^(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?$/;
	if(base_url.length == 0 || !isURL.test(base_url)) {
		$("#bc_base_url").addClass("error");
		success = false;
	}
	
	// * If we're OK, sanitize the data
	if(success) {
		// * remove trailing slashes
		$("#bc_base_url").val($("#bc_base_url").val().replace(/^(.*?)\/+$/, '$1'));
	}
	return success;
}

function startTimer() {
	globalTimer.start();
	//$("#watch").shake(20, 5, 5);
	$("#starttime").attr("disabled", true);
	$("#stoptime").attr("disabled", false);
}

function stopTimer() {
	if(globalTimer.started) {
		var e = globalTimer.getElapsed();
		var hours = roundNumber(e.hours + (e.minutes / 60) + (e.seconds / 60 / 60), 2);
		// * User may be trying to select something, so only change the value if needed.
		if($("#reporthours").val() != hours.toString())
			$("#reporthours").val(hours);
	}
	globalTimer.stop();
	//$("#watch").shake(20, 5, 5);
	$("#starttime").attr("disabled", false);
	$("#stoptime").attr("disabled", true);
}

function updateTimer() {
	$("#time").text(globalTimer.toString());
}

// * Rounds an hour to the given precious, specified in minutes
function roundHour(hour, precision) {
	var minutes = parseFloat(hour) * 60;
	var rest = minutes % precision;
	minutes = minutes - rest; // round down and perhaps round up
	if(rest >= precision/2) {
		return (minutes + precision) / 60;
	} else {
		return minutes / 60;
	}
}

function changeRoundTime() {
	HOUR_PRECISION = $("#roundtime").val();
	widget.setPreferenceForKey(HOUR_PRECISION, "hour_precision");
}

function changeTime(amount) {
	stopTimer();
	var reporthours = $("#reporthours").val().replace(",", ".");
	if(isNaN(reporthours)) reporthours = 0;
	
	var e = globalTimer.getElapsed();
	if(amount) {
		e.minutes = parseInt(e.minutes + amount * HOUR_PRECISION);
	} else {
		e.hours = parseFloat(reporthours);
		e.minutes = 0;
		e.seconds = 0;
	}
	
	globalTimer.setElapsed(e.hours, e.minutes, e.seconds);
	e = globalTimer.getElapsed();
	$("#reporthours").val(e.hours + (e.minutes/60) + (e.seconds/60));
	
	updateTimer();
}

function keyDownTime(e) {
	var VK_UP = 38, VK_DOWN = 40;
	switch(e.keyCode) {
		case VK_UP:
			// * increment time
			changeTime();
			changeTime(1);
			return false;
			
		case VK_DOWN:
			// * decrement time
			changeTime();
			changeTime(-1);
			return false;
	}
}

function openProjectURL() {
	var projectId = $("#projects").val();
	if(projectId)
		widget.openURL(BC_BASE_URL + '/projects/' + projectId);
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
