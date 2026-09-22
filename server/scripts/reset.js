const fs = require('fs');
const path = require('path');
const { DEFAULT_TENANTS } = require('../repositories/tenant-repository');
const { seed } = require('../seed');

// 1. Candado de seguridad estricto para producción
if (process.env.NODE_ENV === 'production') {
  console.error('\n\x1b[41m\x1b[37m[SEGURIDAD CRÍTICA]\x1b[0m \x1b[31mEl comando de reset de datos está estrictamente PROHIBIDO en entornos de producción (NODE_ENV=production).\x1b[0m\n');
  process.exit(1);
}

const STORAGE_ROOT = path.join(__dirname, '..', 'storage');
const TENANTS_DIR = path.join(STORAGE_ROOT, 'tenants');
const RESOURCES_TENANTS_DIR = path.join(STORAGE_ROOT, 'resources', 'tenants');
const OFFICIAL_TENANTS = DEFAULT_TENANTS.map(t => t.id); // ['valle', 'medellin', 'cali']

function resetData() {
  console.log('\n🧹 Iniciando restablecimiento de datos de prueba (Reset)...');

  // 1. Limpieza de carpetas en storage/tenants/
  if (fs.existsSync(TENANTS_DIR)) {
    const tenantEntries = fs.readdirSync(TENANTS_DIR, { withFileTypes: true });
    for (const entry of tenantEntries) {
      const fullPath = path.join(TENANTS_DIR, entry.name);
      if (entry.isDirectory()) {
        if (!OFFICIAL_TENANTS.includes(entry.name)) {
          console.log(`   🗑️  Eliminando tenant de prueba no oficial: ${entry.name}`);
          fs.rmSync(fullPath, { recursive: true, force: true });
        } else {
          // Si es oficial, limpiar archivos de campañas y auditorías viejas para recrearlos
          const files = fs.readdirSync(fullPath);
          for (const f of files) {
            fs.rmSync(path.join(fullPath, f), { recursive: true, force: true });
          }
        }
      }
    }
  }

  // 2. Restaurar registry.json oficial
  fs.mkdirSync(TENANTS_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(TENANTS_DIR, 'registry.json'),
    JSON.stringify(DEFAULT_TENANTS, null, 2),
    'utf-8'
  );
  console.log('   ✅ Registro de portales (registry.json) restablecido a tenants oficiales: ' + OFFICIAL_TENANTS.join(', '));

  // 3. Limpieza de manifests y assets temporales en storage/resources/tenants/
  if (fs.existsSync(RESOURCES_TENANTS_DIR)) {
    const resTenantEntries = fs.readdirSync(RESOURCES_TENANTS_DIR, { withFileTypes: true });
    for (const entry of resTenantEntries) {
      const fullPath = path.join(RESOURCES_TENANTS_DIR, entry.name);
      if (entry.isDirectory()) {
        if (!OFFICIAL_TENANTS.includes(entry.name)) {
          console.log(`   🗑️  Eliminando recursos CDN de tenant no oficial: ${entry.name}`);
          fs.rmSync(fullPath, { recursive: true, force: true });
        } else {
          // Limpiar carpeta manifests para eliminar versiones viejas (v2..v10) y campañas temporales
          const manifestsDir = path.join(fullPath, 'manifests');
          if (fs.existsSync(manifestsDir)) {
            console.log(`   🧹 Limpiando manifiestos y versiones acumuladas en: ${entry.name}/manifests`);
            fs.rmSync(manifestsDir, { recursive: true, force: true });
          }
        }
      }
    }
  }

  // 4. Re-ejecutar seed oficial para recrear campañas, auditorías y manifiestos v1 limpios
  seed();

  // 5. Asegurar estado inicial limpio para Cali
  const caliTenantDir = path.join(TENANTS_DIR, 'cali');
  fs.mkdirSync(caliTenantDir, { recursive: true });
  fs.writeFileSync(path.join(caliTenantDir, 'campaigns.json'), '[]', 'utf-8');
  fs.writeFileSync(path.join(caliTenantDir, 'audit.json'), '[]', 'utf-8');

  console.log('\n\x1b[32m✔ Reset completado exitosamente.\x1b[0m');
  console.log('  ➜ Campañas: Restablecidas a catálogo semilla oficial (Cobro Coactivo en Valle, Pico y Placa en Medellín, Cali limpio).');
  console.log('  ➜ Versiones CDN: Sincronizadas en v1 (versiones de prueba v2...v10 eliminadas).');
  console.log('  ➜ Auditoría: Bitácora restablecida a 1 único evento de publicación inicial por tenant.');
  console.log('  ➜ Seguridad: Recursos institucionales (/resources/brand y /resources/runtime) 100% protegidos.\n');
}

if (require.main === module) {
  resetData();
}

module.exports = { resetData };
