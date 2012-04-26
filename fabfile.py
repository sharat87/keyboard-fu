import os, time
from glob import glob
from fabric.api import task, local, lcd

@task
def clean():
    if os.path.exists('chrome-app'):
        local('rm -Rf chrome-app')

@task
def static():

    local('mkdir -p chrome-app')

    local('cp manifest.json chrome-app')
    local('cp *.html chrome-app')
    local('cp -R vendor chrome-app')
    local('cp -R res chrome-app')

@task
def build(f=None):

    local('mkdir -p chrome-app/js')
    for f in glob('src/*.coffee'):
        coffee(f, os.path.split(f.replace('.coffee', '.js'))[1])

    local('mkdir -p chrome-app/css')
    for f in glob('styles/*.less'):
        lessc(f, os.path.split(f.replace('.less', '.css'))[1])

    local('pycco src/api.coffee')
    local('markdown_py -f docs/usage.html usage.mkd')

    if os.path.exists('chrome-app/docs'):
        local('rm -Rf chrome-app/docs')

    local('mv docs chrome-app')

@task(default=True)
def chrome():
    clean()
    static()
    build()

@task
def pack():

    chrome()

    if os.path.exists('key-fu.zip'):
        local('rm key-fu.zip')

    with lcd('chrome-app'):
        local('zip -r ../key-fu.zip ./*')

@task
def watch():

    globs_to_watch = [
        'manifest.json',
        'usage.mkd',
        'src/*.coffee',
        'styles/*.less',
    ]

    chrome()

    mtimes = {}

    for g in globs_to_watch:
        for f in glob(g):
            mtimes[f] = os.stat(f).st_mtime

    while True:

        for f, old_time in mtimes.items():

            # The file may be reported as non-existent for a very brief
            # period of time sometimes
            if not os.path.exists(f):
                continue

            new_time = os.stat(f).st_mtime

            if new_time != old_time:
                build(f)
                mtimes[f] = new_time

        time.sleep(.2)

@task
def coffee(infile, outfile):
    local('coffee -p {infile} > chrome-app/js/{outfile}'.format(
        infile=infile,
        outfile=outfile
        ))

@task
def lessc(infile, outfile):
    local('lessc {infile} > chrome-app/css/{outfile}'.format(
        infile=infile,
        outfile=outfile
        ))
