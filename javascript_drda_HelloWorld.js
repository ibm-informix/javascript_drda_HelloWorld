/*-
 * Javascript Sample Application: Connection to Informix using DRDA
 */

/*-
 * Topics
 * 1 Create table
 * 2 Inserts
 * 2.1 Insert a single document into a table
 * 2.2 Insert multiple documents into a table
 * 3 Queries
 * 3.1 Find one document in a table that matches a query condition
 * 3.2 Find documents in a table that match a query condition
 * 3.3 Find all documents in a table
 * 4 Update documents in a table
 * 5 Delete documents in a table
 * 6 Drop a table
 */


var express = require('express');
var app = express();
var ibmdb = require("ibm_db");
var tableName = "nodeDRDA";
var sql = "";
var url;
var port = process.env.VCAP_APP_PORT || 3030;
var commands = [];

function doEverything(res){
	parseVcap();
	ibmdb.open(url, function(err, conn) {
		commands.push("Connected to " + url);
	
		function DataFormat (name,value) {
				this.name = name;
				this.value = value;
		}
		
		var user1 = new DataFormat('user1',1);
		var user2 = new DataFormat('user2',2);
		
		function createTable(err) {
			commands.push("\nTopics");
			commands.push("\n#1 Create table");
			
			if (err){ 
				return console.error("error: ", err.message);
			}
			sql = "create table if not exists " + tableName + " (name varchar(255), value integer)";
			conn.prepare(sql,
					function(err, statement) {
						statement.execute(function(err, result) {
							commands.push("Create a table named: " + tableName);
							commands.push("Create Table SQL: " + sql);
							result.closeSync();
							insertOne(err, conn);
						});
					});
		}
		
		function insertOne(err) {
			commands.push("\n2 Inserts");
			commands.push("#2.1 Insert a single document into a table");
			
			if (err){ 
				return console.error("error: ", err.message);
			}
			sql = "insert into " + tableName + " (name, value) VALUES ('" + user1.name + "'," + user1.value + ")";
			conn.prepare(sql,
					function(err, statement) {
						statement.execute(function(err, result) {
							commands.push("Create Document -> name: " + user1.name + " value: " + user1.value);
							commands.push("Single Insert SQL: " + sql);
							result.closeSync();
							insertMultiple(err, conn);
						});
					});
		}
		
		// not supported, must create sql statement to insert multiple
		function insertMultiple(err) {
			commands.push("#2.2: Insert multiple documents into a table. \n\tCurrently there is no support for this section");
			
			if (err){ 
				return console.error("error: ", err.message);
			}
			sql = "insert into " + tableName + " (name, value) VALUES ('" + user2.name + "'," + user2.value + ")";
			conn.prepare(sql,
					function(err, statement) {
						statement.execute(function(err, result) {
							result.closeSync();
							queryById(err, conn);
						});
					});
		}
		
		function queryById(err) {
			commands.push("\n#3 Queries");
			commands.push("#3.1 Find one document in a table that matches a query condition");
			
			if (err){ 
				return console.error("error: ", err.message);
			}
			sql = "select * from " + tableName + " where name LIKE '" + user1.name + "' LIMIT 1";
			conn.query(sql,
					function(err, result) {
						commands.push("First document with name: " + user1.name);
						commands.push("First document with name -> ", JSON.stringify(result));
						commands.push("Query By name SQL: " + sql);
						queryAllById(err, conn);
					});
		}
		
		function queryAllById(err) {
			commands.push("#3.2 Find documents in a table that match a query condition");
			
			if (err){ 
				return console.error("error: ", err.message);
			}
			sql = "select * from " + tableName + " where name LIKE '" + user1.name + "'";
			conn.query(sql, 
					function(err, result) {
						commands.push("Find all documents with name: " + user1.name);
						commands.push("Found Documents: ", JSON.stringify(result));
						commands.push("Query All By name SQL: " + sql);
					listAll(err, conn);
				});
		}
		
		function listAll(err) {
			commands.push("#3.3 Find all documents in a table");
			
			if (err){ 
				return console.error("error: ", err.message);
			}
			sql = "select * from " + tableName;
			conn.query(sql, function(err, result) {
				commands.push("Find all documents in table: " + tableName);
				commands.push("Found Documents: ", JSON.stringify(result));
				commands.push("Find All Documents SQL: " + sql);
				updateData(err, conn);
			});
		}
		
		function updateData(err) {
			commands.push("\n#4 Update documents in a table");
			
			if (err){ 
				return console.error("error: ", err.message);
			}
			sql = "update " + tableName + " set value = 3 where name  = '" + user1.name + "'";
			conn.prepare(sql, 
					function(err, statement) {
						statement.execute(function(err, result) {
							commands.push("Document to update: " + user1.name);
							commands.push("Update By name SQL: " + sql);
							result.closeSync();
							deleteData(err, conn);
						});
					});
		}
		
		function deleteData(err) {
			commands.push("\n#5 Delete documents in a table");
			
			if (err){ 
				return console.error("error: ", err.message);
			}
			sql = "delete from " + tableName + " where name like '" + user1.name + "'";
			conn.prepare(sql, 
					function(err,statement) {
						statement.execute(function(err, result) {
							commands.push("Delete documents with name: " + user1.name);
							commands.push("Delete By name SQL: " + sql);
							result.closeSync();
							dropTable(err, conn);
						});
					});
		}
		
		function dropTable(err) {
			commands.push("\n#6 Drop a table");
			
			if (err){ 
				return console.error("error: ", err.message);
			}
			sql = "drop table " + tableName;
			conn.prepare(sql, 
					function(err, statement) {
						statement.execute(function(err, result) {
							commands.push("Drop table: " + tableName);
							commands.push("Drop Table SQL: " + sql);
							commands.push("\nComplete!");
							result.closeSync();
							printBrowser();
						});
					});
		}
		
		function printLog(){
			for (var i=0; i<commands.length; i++){
				console.log(commands[i]);
			}
		}
		
		function printBrowser(){
			app.set('view engine', 'ejs');
			res.render('index.ejs', {commands: commands});
			closeConnection();
		}
		
		function closeConnection(){
			commands = [];
			conn.close(function(){
				console.log("Connection closed");
			});
		}
		
		createTable();
	});
}

function parseVcap(){
////	 vcap parsing
	var vcap_services = JSON.parse(process.env.VCAP_SERVICES);
	var credentials = vcap_services['altadb-dev'][0].credentials;
	var ssl = false;
	var drdaport;
	var database = credentials.db;
	var host = credentials.host;
	var username = credentials.username;
	var password = credentials.password;
	
	if (ssl){
		drdaport = credentials.ssl_drda_port;
	}
	else{
	    drdaport = credentials.drda_port;  
	}
      
	url = "HOSTNAME=" + host + ";PORT=" + drdaport + ";DATABASE="+ database + ";PROTOCOL=TCPIP;UID=" + username +";PWD="+ password + ";";
}

app.get('/databasetest', function(req, res) {
	doEverything(res);
});

app.get('/', function(req, res) {
//	app.set('view engine', 'ejs');
	res.sendFile(__dirname + '/views/index.html');
});

app.listen(port,  function() {

	// print a message when the server starts listening
  console.log("Server starting on 3030");
});

