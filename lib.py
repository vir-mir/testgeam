#!-*- coding: utf-8 -*-
import random
import memcache

db = memcache.Client(['127.0.0.1:11211'], debug=0)
db.set('clients', [])


def get_random_int(min, max):
    list_rand = db.get('points')
    if not list_rand:
        list_rand = [random.randint(min, max) for x in xrange(1000)]
        db.set('points', list_rand)
    return list_rand