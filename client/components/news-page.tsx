import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { marketAPI } from '@/lib/api';

interface NewsArticle {
    title: string;
    link: string;
    description: string;
    source: string;
    timestamp: string;
    category: string;
    image?: string;
}

export default function NewsPage() {
    const [news, setNews] = useState<NewsArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState('All');

    const fetchNews = async () => {
        try {
            setLoading(true);
            const data = await marketAPI.getGeneralNews();
            setNews(data);
        } catch (error) {
            console.error('Failed to fetch news:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNews();
        const interval = setInterval(fetchNews, 60000);
        return () => clearInterval(interval);
    }, []);

    const filteredNews = news.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filter === 'All' || item.source === filter;
        return matchesSearch && matchesFilter;
    });

    const sources = ['All', ...new Set(news.map(item => item.source))];

    return (
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-500">
            {/* Header */}
            <div className="px-6 py-5 border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2.5">
                        Crypto Pulse
                    </h1>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                <div className="w-full">
                    {/* Source Filters */}
                    <div className="flex flex-wrap gap-2 mb-8">
                        {sources.map(s => (
                            <button
                                key={s}
                                onClick={() => setFilter(s)}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${filter === s
                                    ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 translate-y-[-1px]'
                                    : 'bg-secondary/20 text-muted-foreground border-border hover:bg-secondary/40 hover:text-foreground'
                                    }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>

                    {loading ? (
                        <div className="flex flex-col gap-4">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="bg-card border border-border rounded-xl p-6 h-40 animate-pulse flex gap-6">
                                    <div className="flex-1">
                                        <div className="w-32 h-4 bg-secondary/50 rounded-lg mb-4" />
                                        <div className="w-full h-6 bg-secondary/50 rounded-lg mb-2" />
                                        <div className="w-3/4 h-6 bg-secondary/50 rounded-lg mb-4" />
                                        <div className="w-full h-4 bg-secondary/50 rounded-lg" />
                                    </div>
                                    <div className="w-48 h-full bg-secondary/50 rounded-lg shrink-0 hidden sm:block" />
                                </div>
                            ))}
                        </div>
                    ) : filteredNews.length > 0 ? (
                        <div className="flex flex-col gap-4">
                            {filteredNews.map((item, idx) => (
                                <a
                                    key={idx}
                                    href={item.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-card border border-border/60 rounded-xl p-5 flex flex-col sm:flex-row gap-6 hover:border-border transition-all duration-200 group"
                                >
                                    <div className="flex-1 flex flex-col justify-center">
                                        <div className="flex items-center gap-1.5 text-xs mb-2 text-muted-foreground font-medium">
                                            <span className="text-foreground font-bold tracking-tight">{item.source}</span>
                                            <span>&middot;</span>
                                            <span>{item.timestamp.split(' ').slice(0, 4).join(' ')}</span>
                                        </div>

                                        <h3 className="text-xl font-bold text-foreground mb-2 leading-snug group-hover:underline transition-colors line-clamp-2">
                                            {item.title}
                                        </h3>

                                        <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">
                                            {item.description}
                                        </p>
                                    </div>

                                    <div className="w-full sm:w-64 h-36 rounded-lg overflow-hidden shrink-0 border border-border/50 hidden sm:block">
                                        <img
                                            src={item.image || `https://picsum.photos/seed/${item.title.length + idx}/400/200`}
                                            alt={item.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            loading="lazy"
                                        />
                                    </div>
                                </a>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-32 text-center bg-card/30 rounded-3xl border border-dashed border-border">
                            <div className="w-20 h-20 bg-secondary/20 rounded-full flex items-center justify-center mb-6">
                                <Search className="w-8 h-8 text-muted-foreground opacity-30" />
                            </div>
                            <h3 className="text-2xl font-bold text-foreground mb-2">No news matches your pulse</h3>
                            <p className="text-muted-foreground max-w-sm">Try adjusting your filters or search terms to find what's happening in the market.</p>
                            <button
                                onClick={() => { setSearchQuery(''); setFilter('All'); }}
                                className="mt-8 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
                            >
                                Clear all filters
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
