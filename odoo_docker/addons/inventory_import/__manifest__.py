{
    'name': 'Inventory Import Integration',
    'version': '1.0',
    'category': 'Custom',
    'summary': 'Import aggregated results from course project via API token',
    'depends': ['base'],
    'data': [
        'security/ir.model.access.csv',
        'views/inventory_import_views.xml',
    ],
    'installable': True,
    'application': True,
    'auto_install': False,
}
