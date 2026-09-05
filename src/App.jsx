import { useState, useEffect } from 'react';
import { Skeleton } from 'boneyard-js/react';

// Componente de tarjeta de blog (puedes adaptarlo a lo que necesites)
function BlogCard({ data }) {
    return (
        <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px' }}>
            <h2>{data.title}</h2>
            <p>{data.content}</p>
        </div>
    );
}

function App() {
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState(null);

    // Simula una petición de datos (por ejemplo, desde tu backend)
    useEffect(() => {
        const timer = setTimeout(() => {
            setData({
                title: 'Evento detectado',
                content: 'Se ha identificado una pistola con 92% de confianza.',
            });
            setIsLoading(false);
        }, 3000); // 3 segundos de carga

        return () => clearTimeout(timer);
    }, []);

    return (
        <div style={{ padding: '20px' }}>
            <h1>Mi App con Skeleton</h1>

            {/* Esqueleto mientras loading = true */}
            <Skeleton name="blog-card" loading={isLoading}>
                {data && <BlogCard data={data} />}
            </Skeleton>
        </div>
    );
}

export default App;