# CodeEditorApp

### Installation instructions for Ubuntu 14.04

A. Clone the repository.  

```bash
git clone git@github.com:agordillo/CodeEditorApp.git
```

B. Install apache and edit the /etc/apache2/sites-available/000-default.conf file.  

```bash
Alias /CodeEditor/ "#{CodeEditorAppFolder}"
<Directory "#{CodeEditorAppFolder}">
   Options Indexes FollowSymLinks MultiViews
	AllowOverride None
	Order allow,deny
	allow from all
</Directory>
```

Restart apache then.  

```bash
sudo /etc/init.d/apache2 restart
```

Access to http://localhost/CodeEditor/ .

That's it!
