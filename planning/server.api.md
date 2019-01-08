# HTTP
| request | response |
| :------ | -------: |
| / | 200 |


# socket in 
## on connection event 
clients gets a unique Id attached (random + time)
## on disconnect event 
if client belongs to room and this was the last client
the room is removed (it checks by room.id)

## Join
client sends room.id to which to join to and receives all **clients** inside the room if the room is found, else an error *404 room not found* \
server adds clients to room list \
server adds room.id to client \
notifies all other clients that client connected (sends client.id)

## Create
client sends *room_name* and room is created with *name + client.id* then client is added to room \

## Send 
by client room.id it sends the data to all other in the room 




# Code structure 
server has room *set*

