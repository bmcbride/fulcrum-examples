import urllib2
url = 'https://web.fulcrumapp.com/shares/b711f907a8d42665.csv'
u = urllib2.urlopen(url)
localFile = open('fulcrum_data.csv', 'w')
localFile.write(u.read())
localFile.close()