Web Scraping Setup
------------
To Setup the python Facebook scraper you can either directly install the dependencies using: 

.. code:: bash

    $ pip install -r requirements.txt
    
Then go ahead and run the scraper using:

.. code:: bash

    $ python3 facebookEventScraper.py latitude longitude distance limit

The command line arguements are all required and are as follows:
    - Latitude - coordinate for center
    - Longitude - coordinate for center
    - Distance - distance to search around center
    - Limit - limiting number on results, which will affect speed
    
This will output the amount of events it has uploaded to the database.



You can also do this in a virtual enviorment by doing the following to avoid installing the dependencies locally. Be sure to have virtualenv installed on your computer before you follow these directions:

.. code:: bash

    $ virtualenv -p /path/to/python3 venv
    
Then go ahead and activate your virtual enviorment:

.. code:: bash

    $ source venv/bin/activate 
    
Now install the dependencies:

.. code:: bash

    $ pip install -r requirements.txt
    
Next, follow the instructions above to run the scraper. Let us know if you have any questions. 
