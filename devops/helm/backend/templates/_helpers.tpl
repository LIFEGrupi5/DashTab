{{/*
Helper templates — reusable snippets so names/labels stay consistent across
every manifest in this chart. Called with {{ include "backend.fullname" . }}.
*/}}

{{- define "backend.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/* Release-scoped name, e.g. "dashtab-backend".
     If the release name already contains the chart name (release "dashtab-backend"),
     use it as-is to avoid "backend-backend"; otherwise prefix it. */}}
{{- define "backend.fullname" -}}
{{- if contains (include "backend.name" .) .Release.Name -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name (include "backend.name" .) | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}

{{/* Labels stamped on every object */}}
{{- define "backend.labels" -}}
app.kubernetes.io/name: {{ include "backend.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/part-of: dashtab
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}

{{/* Selector labels — the subset used to match pods to the Deployment/Service */}}
{{- define "backend.selectorLabels" -}}
app.kubernetes.io/name: {{ include "backend.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}
