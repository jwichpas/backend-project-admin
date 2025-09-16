<template>
  <div class="max-w-6xl mx-auto p-6 space-y-8">
    <!-- Header -->
    <div class="text-center mb-12">
      <h1 class="text-4xl font-bold text-primary mb-4">Sistema de Administración y POS</h1>
      <p class="text-xl text-muted-foreground max-w-2xl mx-auto">
        Solución integral para la gestión empresarial con punto de venta moderno,
        facturación electrónica SUNAT y gestión completa de inventarios.
      </p>
    </div>

    <!-- Features Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
      <!-- POS Feature -->
      <div class="bg-card rounded-lg p-6 border shadow-sm">
        <div class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
          <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5 6m0 0h9m-9 0L6 19m9 0a2 2 0 11-4 0 2 2 0 014 0zm0 0V9a2 2 0 10-4 0v10.01M9 19a2 2 0 11-4 0 2 2 0 014 0z"/>
          </svg>
        </div>
        <h3 class="text-lg font-semibold mb-2">Punto de Venta Moderno</h3>
        <p class="text-muted-foreground text-sm">
          Interfaz intuitiva con carrito de compras, búsqueda inteligente de productos y edición inline con conversiones de unidades automáticas.
        </p>
      </div>

      <!-- Electronic Invoicing -->
      <div class="bg-card rounded-lg p-6 border shadow-sm">
        <div class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
          <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
        </div>
        <h3 class="text-lg font-semibold mb-2">Facturación Electrónica SUNAT</h3>
        <p class="text-muted-foreground text-sm">
          Integración completa con SUNAT para generación automática de facturas y boletas electrónicas con XML/PDF.
        </p>
      </div>

      <!-- Inventory Management -->
      <div class="bg-card rounded-lg p-6 border shadow-sm">
        <div class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
          <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
          </svg>
        </div>
        <h3 class="text-lg font-semibold mb-2">Gestión de Inventarios</h3>
        <p class="text-muted-foreground text-sm">
          Control de stock en tiempo real con visualización 2D/3D de almacenes, ubicaciones específicas y trazabilidad completa.
        </p>
      </div>

      <!-- Analytics -->
      <div class="bg-card rounded-lg p-6 border shadow-sm">
        <div class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
          <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
          </svg>
        </div>
        <h3 class="text-lg font-semibold mb-2">Dashboard de Análisis</h3>
        <p class="text-muted-foreground text-sm">
          Gráficos interactivos con ApexCharts, reportes de ventas, tendencias del negocio y métricas en tiempo real.
        </p>
      </div>

      <!-- Company Management -->
      <div class="bg-card rounded-lg p-6 border shadow-sm">
        <div class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
          <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
          </svg>
        </div>
        <h3 class="text-lg font-semibold mb-2">Gestión Empresarial</h3>
        <p class="text-muted-foreground text-sm">
          Administración completa de empresas, usuarios con roles, clientes y toda la configuración del negocio.
        </p>
      </div>

      <!-- Technology -->
      <div class="bg-card rounded-lg p-6 border shadow-sm">
        <div class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
          <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
          </svg>
        </div>
        <h3 class="text-lg font-semibold mb-2">Tecnología Moderna</h3>
        <p class="text-muted-foreground text-sm">
          Vue 3, TypeScript, TailwindCSS v4, shadcn/ui, Supabase, ApexCharts y las mejores prácticas de desarrollo.
        </p>
      </div>
    </div>

    <!-- Technical Details -->
    <div class="bg-muted/30 rounded-lg p-8">
      <h2 class="text-2xl font-bold mb-6 text-center">Arquitectura Técnica</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <!-- Frontend -->
        <div>
          <h3 class="text-lg font-semibold mb-4 text-primary">Frontend</h3>
          <ul class="space-y-2 text-sm text-muted-foreground">
            <li>• Vue 3 con Composition API</li>
            <li>• TypeScript para seguridad de tipos</li>
            <li>• TailwindCSS v4 + shadcn/ui</li>
            <li>• Pinia para gestión de estado</li>
            <li>• Vite con Rolldown bundler</li>
            <li>• ApexCharts para visualizaciones</li>
          </ul>
        </div>

        <!-- Backend -->
        <div>
          <h3 class="text-lg font-semibold mb-4 text-primary">Backend & Servicios</h3>
          <ul class="space-y-2 text-sm text-muted-foreground">
            <li>• Supabase (PostgreSQL + Auth)</li>
            <li>• Storage para archivos</li>
            <li>• Real-time subscriptions</li>
            <li>• RPC functions personalizadas</li>
            <li>• Integración SUNAT API</li>
            <li>• Generación XML/PDF automática</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="text-center py-8 border-t border-border">
      <p class="text-muted-foreground">
        Sistema desarrollado con las mejores prácticas y tecnologías modernas para la gestión empresarial integral.
      </p>
    </div>
  </div>
</template>
