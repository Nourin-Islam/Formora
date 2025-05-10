{
    'name': 'Formora Integration',
    'version': '1.0',
    'summary': 'Integration with Formora form system',
    'description': """
        This module integrates with Formora to display aggregated form results
    """,
    'author': 'Your Name',
    'depends': ['base'],
    'data': [
    'security/ir.model.access.csv',
    'views/templates_views.xml',    # Contains the template views
    'views/questions_views.xml',    # Contains question views
    'views/import_wizard_views.xml', # Contains wizard form view
    'views/menu.xml',               # MUST BE LAST - references all other views
    ],
    'installable': True,
    'application': True,
    'license': 'LGPL-3',
}