function strlimit(str, limit) {
	if(str.length > limit)
		return str.substr(0, limit) + "...";
	else
		return str;
}

function zerofill(no, digits) {
	if(no.toString().length < digits) {
		no = '0' + no;
		return zerofill(no, digits);
	} else {
		return no;
	}
}
