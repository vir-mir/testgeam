#!/usr/bin/env python
#!-*- coding: utf-8 -*-

import json
from random import random

import tornado.web
import tornado.ioloop
import tornado.websocket
from tornado import template
import memcache


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
        clients = self.application.db.get('clients')

        if not clients:
            self.application.db.set('clients', [id(self)])
        else:
            clients.append(id(self))
            self.application.db.replace('clients', clients)
            if len(clients) > 1:
                self.sends(clients, 'ready')

            if len(clients) > 3:
                vals = clients[:4]
                self.application.db.replace('actives_%s' % random(), vals)
                self.application.db.replace('clients', clients[4:])
                self.sends(vals, 'start')

    def go_user(self):
        clients = self.application.db.get('clients')

        if clients and id(self) in clients:
            vals = clients[clients.index(id(self)):4]
            self.application.db.replace('actives_%s' % random(), vals)
            self.application.db.replace('clients', clients[:clients.index(id(self))] + clients[clients.index(id(self))+4:])
            self.sends(vals, 'start')

    def on_message(self, message):
        message_dict = json.loads(message)

        if 'new' in message_dict['action']:
            self.new_user()
        elif 'go' in message_dict['action']:
            self.go_user()

    def on_close(self, message=None):
        for key, value in enumerate(self.application.webSocketsPool):
            if value == self:
                del self.application.webSocketsPool[key]
                break


class Application(tornado.web.Application):
    def __init__(self):
        self.webSocketsPool = []

        self.db = memcache.Client(['127.0.0.1:11211'], debug=0)
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