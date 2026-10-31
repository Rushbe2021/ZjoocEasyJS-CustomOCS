import { createElement, Database, House, Info, Link, Settings } from 'lucide';

const DEFAULT_ATTRS = {
    width: 20,
    height: 20,
    'stroke-width': 2,
    'aria-hidden': 'true',
};

export function createIcon(iconNode, attrs = {}) {
    return createElement(iconNode, { ...DEFAULT_ATTRS, ...attrs });
}

export const icons = {
    home: House,
    settings: Settings,
    answerer: Database,
    database: Database,
    links: Link,
    about: Info,
};
