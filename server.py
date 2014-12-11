#!/usr/bin/env python
#!-*- coding: utf-8 -*-
import hashlib

import json
from random import random

import tornado.web
import tornado.ioloop
import tornado.websocket
import lib
import time


class MainHandler(tornado.web.RequestHandler):
    def get(self):
        messages = []
        self.render('index.html', messages=messages)


class WebSocket(tornado.websocket.WebSocketHandler):
    def open(self):
        self.application.webSocketsPool.append(self)

    def send_push(self, item, message, data=None):
        for ws in self.application.webSocketsPool:
            if item == id(ws):
                ws.ws_connection.write_message(json.dumps({
                    'action': message,
                    'data': data,
                    'id': id(ws)
                }))

    def sends(self, clients, message, data=None):
        for client in clients:
            self.send_push(client, message, data)

    def new_user(self):
        clients = lib.db.get('clients')

        if not clients:
            lib.db.set('clients', [id(self)])
            self.sends([id(self)], 'ready', {'points': lib.get_random_int(20, 200), 'host': 1})
        else:
            clients.append(id(self))
            lib.db.replace('clients', clients)

            if len(clients) > 3:
                self.go_user()
            else:
                self.sends(clients, 'ready', {'points': lib.get_random_int(20, 200)})

    def go_user(self):
        clients = lib.db.get('clients')
        sha1 = hashlib.sha1(b'%s%s' % (id(self), time.time()))
        session_id = 'actives_%s' % sha1.hexdigest()
        lib.db.set(session_id, clients)
        lib.db.replace('clients', [])
        lib.db.set('points', [])
        self.sends(clients, 'start', {'clients': clients, 'session_id': session_id})

    def on_message(self, message):
        message_dict = json.loads(message)

        if 'new' in message_dict['action']:
            self.new_user()
        elif 'go' in message_dict['action']:
            self.go_user()
        elif 'jump' in message_dict['action']:
            self.jump_user(message_dict)
        elif 'timer' in message_dict['action']:
            self.timer_user()

    def jump_user(self, message_dict):
        clients = lib.db.get(message_dict['session_id'].encode('utf-8'))
        if clients:
            if message_dict['user_id'] in clients:
                clients.pop(clients.index(message_dict['user_id']))
            self.sends(clients, "jump", {
                "player_index": message_dict['player_index']
            })

    def timer_user(self):
        self.sends([id(self)], "timer")

    def on_close(self, message=None):
        for key, value in enumerate(self.application.webSocketsPool):
            if value == self:
                del self.application.webSocketsPool[key]
                clients = lib.db.get('clients')
                if id(self) in clients:
                    clients.pop(clients.index(id(self)))
                lib.db.set('clients', clients)
                break


class Application(tornado.web.Application):
    def __init__(self):
        self.webSocketsPool = []

        handlers = (
            (r'/', MainHandler),
            (r'/websocket/?', WebSocket),
            (r'/static/(.*)', tornado.web.StaticFileHandler,
             {'path': 'static/'}),
        )
        tornado.web.Application.__init__(self, handlers)


application = Application()

if __name__ == '__main__':
    application.listen(8888)
    tornado.ioloop.IOLoop.instance().start()