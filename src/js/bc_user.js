// * Function for fetching the users ID.
// * Nescessary since BC API is broken and doesn't proide it
function getCategories(callback) {
	// * pull out a random project and act on it
	randomProject = null;
	for(var i in allProjects) {
		randomProject = allProjects[i];
		break;
	}
	if(randomProject == null)
		alert('error: missing projects pull to get user id from');
	
	var prjId = randomProject.id;
	
	
	console.log('pulling user id via project: '+prjId);
	// ------------------
	// GET ALL CATEGORIES
	var categoryURL = BC_BASE_URL + "/projects/"+prjId+"/categories.xml";
	var opts = $.extend({}, ajaxOptions);
	
	var categories = [];
	opts.url = categoryURL;
	opts.success = function(root) {
		$(root).find("categories > category").each(function() {
			var type = $(this).find("> type").text().toLowerCase();
			if(type == 'postcategory') {
				categories.push($(this).find("> id").text());
			}
		});
		
		createPost(prjId, categories, callback);
	};
	$.ajax(opts);
}


function createPost(project_id, categories, callback) {
	// ------------------
	// CREATE THE POST
	
	var postURL = BC_BASE_URL + "/projects/"+project_id+"/posts.xml";
	xml = "";
	xml += '<request>';
	xml += '  <post>';
	xml += '    <category-id>'+categories[0]+'</category-id>';
	xml += '    <title>Delete this message</title>';
	xml += '    <body>Delete this message</body>';
	xml += '    <extended-body></extended-body>';
	xml += '    <private>0</private>';
	xml += '  </post>';
	xml += '</request>';
	
	var opts = $.extend({}, ajaxOptions);
	opts.data = xml;
	opts.processData = false;
	
	opts.type = 'POST';
	opts.url = postURL;
	opts.complete = function(xobj, status) { window.xobj = xobj; readPost(xobj, callback); };
	$.ajax(opts);
}

function readPost(xobj, callback) {
	// ------------------
	// FETCH THE POST WITH THE USER ID
	
	var newPostURL = BC_BASE_URL + xobj.getResponseHeader('location');
	var opts = $.extend({}, ajaxOptions);
	var authorId = -1;
	var postRoot = null;
	var postId = 0;
	opts.url = newPostURL;
	opts.success = function(postRoot) {
		authorId = $(postRoot).find("post > author-id").text();
		postId = $(postRoot).find("post > id").text();
		
		BC_USER_ID = authorId;
		widget.setPreferenceForKey(authorId, "user_id");
		$("#bc_user_id").val(BC_USER_ID);
		
		deletePost(postId, callback);
	};
	$.ajax(opts);
}

function deletePost(post_id, callback) {
	// -------------------
	// DELETE POST
	var deletePostURL = BC_BASE_URL + "/posts/" + post_id + ".xml";
	var opts = $.extend({}, ajaxOptions);
	opts.url = deletePostURL;
	opts.type = 'DELETE';
	opts.success = function(root) { /* bah. ignore it. */ };
	$.ajax(opts);
	
	callback();
}


