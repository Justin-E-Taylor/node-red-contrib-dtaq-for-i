# node-red-contrib-dtaq-for-i
Node-RED custom node for IBM i data queues

This is a working sample of a custom Node-RED node for interacting with IBM i data queues.  Uses *LOCAL Db2 connection, so must run native.
* **dtaq in** monitors a FIFO data queue and initiates a flow when a new message is received.
* **dtaq out** writes messages to a keyed data queue.

### This is a proof-of-concept and should not be considered production-ready.
