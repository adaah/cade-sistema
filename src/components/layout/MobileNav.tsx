<<<<<<< HEAD
import { Home, BookOpen, Calendar, MoreHorizontal } from 'lucide-react';
=======
import { Home, BookOpen, Calendar, GitBranch, MoreHorizontal } from 'lucide-react';
>>>>>>> a397210beb9a30ba0d5df243336fa4bc022922ae
import { NavLink } from '@/components/NavLink';
import { cn } from '@/lib/utils';

const menuItems = [
  { title: 'Início', url: '/', icon: Home },
  { title: 'Disciplinas', url: '/disciplinas', icon: BookOpen },
  { title: 'Planejador', url: '/planejador', icon: Calendar },
<<<<<<< HEAD
=======
  { title: 'Fluxograma', url: '/fluxograma', icon: GitBranch },
>>>>>>> a397210beb9a30ba0d5df243336fa4bc022922ae
  { title: 'Mais', url: '/configuracoes', icon: MoreHorizontal },
];

export function MobileNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 animate-slide-in-bottom">
      <ul className="flex justify-around items-center h-16 px-2">
        {menuItems.map((item) => (
          <li key={item.url}>
            <NavLink
              to={item.url}
              className={cn(
                "flex flex-col items-center justify-center px-3 py-2 rounded-lg",
                "text-muted-foreground transition-colors"
              )}
              activeClassName="text-primary"
            >
              <item.icon className="w-6 h-6" />
              <span className="text-xs mt-1 font-medium">{item.title}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
