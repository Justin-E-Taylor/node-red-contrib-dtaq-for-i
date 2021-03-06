const { dbconn, dbstmt } = require('idb-connector');

module.exports = function (RED) {
    function DtaqInNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        const d = new Date().toISOString();
        node.log(`dtaq-in node ${d} - ${node.id} created.`);

        let connection = new dbconn();
        connection.conn('*LOCAL');
        const messageDataLength = (isNaN(config.length) || config.length == '' ? 1024 : config.length);
        const sql = `select cast(MESSAGE_DATA as varChar(${messageDataLength})) as Message \
                        from table(QSYS2.RECEIVE_DATA_QUEUE(\
                            DATA_QUEUE => ?,DATA_QUEUE_LIBRARY => ?,WAIT_TIME => ?)) \
                            fetch first 1 row only`;
        const params = [config.queue, config.library, config.wait];

        let state = { isClosed: false };


        node.on("close", function (done) {
            node.log(`Closing node ${d} - ${node.id}`);
            state.isClosed = true;
            connection.disconn();
            connection.close();
            done();
        });


        const checkForMessage = function () {
            if (state.isClosed == true) {
                connection = new dbconn();
                connection.conn('*LOCAL');
                state.isClosed = false;
            }
            const statement = new dbstmt(connection);
            statement.prepare(sql, (error) => {
                if (error) {
                    node.error(error);
                    node.error(JSON.stringify(error));
                    throw error;
                }
                statement.bindParameters(params, (error) => {
                    if (error) {
                        node.error(error);
                        node.error(JSON.stringify(error));
                        throw error;
                    }
                    statement.execute((out, error) => {
                        if (error) {
                            node.error(error);
                            node.error(JSON.stringify(error));
                            throw error;
                        }

                        statement.fetch((row, rc) => {
                            if (rc instanceof Error) {
                                node.error(rc);
                                node.error(JSON.stringify(rc));
                                throw rc;
                            }
                            const execute_timeout = 100;
                            if (rc != execute_timeout) {
                                const msg = JSON.parse(row.MESSAGE);
                                if (msg != "") {
                                    node.status({ fill: "green", shape: "ring", text: "done" });
                                    node.send({
                                        payload: msg
                                    });
                                }
                                else {
                                    node.log(`msg==${JSON.parse(row)}`);
                                }
                            }
                            statement.closeCursor();
                            statement.close();
                            setTimeout(checkForMessage, 1000);
                        });
                    });
                });
            });
        }

        
        if (!node.listen) {
            node.listen = true;
            node.log("waiting for message on " + config.queue);
            checkForMessage();
        }
    }

    RED.nodes.registerType("dtaq-in", DtaqInNode);
}
