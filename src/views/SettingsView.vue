<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-foreground">Configuración</h1>
        <p class="text-muted-foreground">
          Administra la configuración del sistema y empresa
        </p>
      </div>
    </div>

    <!-- Settings Navigation -->
    <div class="grid gap-6 lg:grid-cols-4">
      <!-- Settings Menu -->
      <div class="lg:col-span-1">
        <Card>
          <CardContent class="p-4">
            <nav class="space-y-2">
              <Button
                v-for="section in settingSections"
                :key="section.id"
                :variant="activeSection === section.id ? 'default' : 'ghost'"
                class="w-full justify-start"
                @click="activeSection = section.id"
              >
                <component :is="section.icon" class="mr-2 h-4 w-4" />
                {{ section.label }}
              </Button>
            </nav>
          </CardContent>
        </Card>
      </div>

      <!-- Settings Content -->
      <div class="lg:col-span-3 space-y-6">
        <!-- Company Settings -->
        <div v-if="activeSection === 'company'">
          <Card>
            <CardHeader>
              <CardTitle>Información de la Empresa</CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
              <div class="grid gap-4 md:grid-cols-2">
                <div>
                  <label class="text-sm font-medium">RUC</label>
                  <Input v-model="companyForm.ruc" placeholder="20600055519" class="mt-1" />
                </div>
                <div>
                  <label class="text-sm font-medium">Razón Social</label>
                  <Input v-model="companyForm.legal_name" placeholder="MI EMPRESA SAC" class="mt-1" />
                </div>
                <div>
                  <label class="text-sm font-medium">Nombre Comercial</label>
                  <Input v-model="companyForm.trade_name" placeholder="MI EMPRESA" class="mt-1" />
                </div>
                <div>
                  <label class="text-sm font-medium">Moneda</label>
                  <select class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="PEN">Soles (PEN)</option>
                    <option value="USD">Dólares (USD)</option>
                  </select>
                </div>
              </div>
              <div>
                <label class="text-sm font-medium">Dirección</label>
                <Input v-model="companyForm.address" placeholder="Av. Principal 123" class="mt-1" />
              </div>
              <Button>
                <Save class="mr-2 h-4 w-4" />
                Guardar Cambios
              </Button>
            </CardContent>
          </Card>
        </div>

        <!-- SUNAT Settings -->
        <div v-if="activeSection === 'sunat'">
          <Card>
            <CardHeader>
              <CardTitle>Configuración SUNAT</CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
              <div class="grid gap-4 md:grid-cols-2">
                <div>
                  <label class="text-sm font-medium">Usuario SOL</label>
                  <Input v-model="sunatForm.sol_user" placeholder="Usuario SOL" class="mt-1" />
                </div>
                <div>
                  <label class="text-sm font-medium">Clave SOL</label>
                  <Input v-model="sunatForm.sol_pass" type="password" placeholder="••••••••" class="mt-1" />
                </div>
              </div>
              <div>
                <label class="text-sm font-medium">Certificado Digital</label>
                <div class="mt-1 flex items-center gap-2">
                  <Input placeholder="Ruta del certificado" readonly />
                  <Button variant="outline">
                    <Upload class="mr-2 h-4 w-4" />
                    Subir
                  </Button>
                </div>
              </div>
              <div class="flex items-center space-x-2">
                <input type="checkbox" id="production" class="rounded" />
                <label for="production" class="text-sm">Usar ambiente de producción</label>
              </div>
              <Button>
                <Save class="mr-2 h-4 w-4" />
                Guardar Configuración SUNAT
              </Button>
            </CardContent>
          </Card>
        </div>

        <!-- Document Series -->
        <div v-if="activeSection === 'documents'">
          <Card>
            <CardHeader>
              <div class="flex items-center justify-between">
                <CardTitle>Series de Documentos</CardTitle>
                <Button size="sm">
                  <Plus class="mr-2 h-4 w-4" />
                  Nueva Serie
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Serie</TableHead>
                    <TableHead>Último Número</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead class="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-for="series in documentSeries" :key="series.id">
                    <TableCell>{{ series.doc_type_name }}</TableCell>
                    <TableCell>
                      <code class="bg-muted px-2 py-1 rounded">{{ series.series }}</code>
                    </TableCell>
                    <TableCell>{{ series.last_number.padStart(8, '0') }}</TableCell>
                    <TableCell>
                      <Badge :variant="series.is_active ? 'success' : 'outline'">
                        {{ series.is_active ? 'Activa' : 'Inactiva' }}
                      </Badge>
                    </TableCell>
                    <TableCell class="text-right">
                      <Button variant="ghost" size="icon" class="h-8 w-8">
                        <Edit class="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <!-- User Management -->
        <div v-if="activeSection === 'users'">
          <Card>
            <CardHeader>
              <div class="flex items-center justify-between">
                <CardTitle>Gestión de Usuarios</CardTitle>
                <Button size="sm">
                  <UserPlus class="mr-2 h-4 w-4" />
                  Nuevo Usuario
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead class="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-for="user in users" :key="user.id">
                    <TableCell>
                      <div class="flex items-center gap-3">
                        <div class="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                          <User class="h-4 w-4" />
                        </div>
                        {{ user.name }}
                      </div>
                    </TableCell>
                    <TableCell>{{ user.email }}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{{ user.role }}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge :variant="user.is_active ? 'success' : 'outline'">
                        {{ user.is_active ? 'Activo' : 'Inactivo' }}
                      </Badge>
                    </TableCell>
                    <TableCell class="text-right">
                      <Button variant="ghost" size="icon" class="h-8 w-8">
                        <Edit class="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <!-- System Settings -->
        <div v-if="activeSection === 'system'">
          <Card>
            <CardHeader>
              <CardTitle>Configuración del Sistema</CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <div>
                    <h4 class="font-medium">Modo Oscuro</h4>
                    <p class="text-sm text-muted-foreground">Cambiar tema de la interfaz</p>
                  </div>
                  <input type="checkbox" class="rounded" />
                </div>
                <div class="flex items-center justify-between">
                  <div>
                    <h4 class="font-medium">Notificaciones</h4>
                    <p class="text-sm text-muted-foreground">Recibir notificaciones del sistema</p>
                  </div>
                  <input type="checkbox" class="rounded" checked />
                </div>
                <div class="flex items-center justify-between">
                  <div>
                    <h4 class="font-medium">Backup Automático</h4>
                    <p class="text-sm text-muted-foreground">Respaldo diario de datos</p>
                  </div>
                  <input type="checkbox" class="rounded" checked />
                </div>
              </div>
              <Button>
                <Save class="mr-2 h-4 w-4" />
                Guardar Configuración
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  Building,
  FileText,
  Receipt,
  Users,
  Settings,
  Save,
  Upload,
  Plus,
  Edit,
  User,
  UserPlus
} from 'lucide-vue-next'

// UI Components
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import CardHeader from '@/components/ui/CardHeader.vue'
import CardTitle from '@/components/ui/CardTitle.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Input from '@/components/ui/Input.vue'
import Table from '@/components/ui/Table.vue'
import TableHeader from '@/components/ui/TableHeader.vue'
import TableRow from '@/components/ui/TableRow.vue'
import TableHead from '@/components/ui/TableHead.vue'
import TableBody from '@/components/ui/TableBody.vue'
import TableCell from '@/components/ui/TableCell.vue'
import Badge from '@/components/ui/Badge.vue'

const activeSection = ref('company')

const settingSections = [
  { id: 'company', label: 'Empresa', icon: Building },
  { id: 'sunat', label: 'SUNAT', icon: Receipt },
  { id: 'documents', label: 'Documentos', icon: FileText },
  { id: 'users', label: 'Usuarios', icon: Users },
  { id: 'system', label: 'Sistema', icon: Settings }
]

// Forms
const companyForm = ref({
  ruc: '20600055519',
  legal_name: 'MI EMPRESA SAC',
  trade_name: 'MI EMPRESA',
  address: 'Av. Arequipa 123'
})

const sunatForm = ref({
  sol_user: '',
  sol_pass: ''
})

// Mock data
const documentSeries = ref([
  { id: '1', doc_type_name: 'Factura', series: 'F001', last_number: '1', is_active: true },
  { id: '2', doc_type_name: 'Boleta', series: 'B001', last_number: '0', is_active: true },
  { id: '3', doc_type_name: 'Nota de Crédito', series: 'FC01', last_number: '0', is_active: true }
])

const users = ref([
  { id: '1', name: 'Admin Sistema', email: 'admin@empresa.com', role: 'Administrador', is_active: true },
  { id: '2', name: 'Juan Vendedor', email: 'vendedor@empresa.com', role: 'Vendedor', is_active: true },
  { id: '3', name: 'María Contadora', email: 'contadora@empresa.com', role: 'Contador', is_active: false }
])
</script>