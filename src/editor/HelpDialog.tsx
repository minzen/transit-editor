import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, List, ListItem, ListItemText, Divider, useMediaQuery, useTheme } from '@mui/material'
import { useTranslation } from 'react-i18next'

type Props = {
    open: boolean
    onClose: () => void
}

export function HelpDialog({ open, onClose }: Props) {
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
    const { t } = useTranslation()

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth fullScreen={isMobile}>
            <DialogTitle>{t('helpDialog.title')}</DialogTitle>
            <DialogContent>
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>{t('helpDialog.gettingStarted')}</Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        {t('helpDialog.gettingStartedBody')}
                    </Typography>
                </Box>

                <Divider sx={{ mb: 2 }} />

                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>{t('helpDialog.tools')}</Typography>
                    <List dense>
                        <ListItem>
                            <ListItemText
                                primary={t('helpDialog.selectTool')}
                                secondary={t('helpDialog.selectToolDesc')}
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemText
                                primary={t('helpDialog.stationTool')}
                                secondary={t('helpDialog.stationToolDesc')}
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemText
                                primary={t('helpDialog.segmentTool')}
                                secondary={t('helpDialog.segmentToolDesc')}
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemText
                                primary={t('helpDialog.shapeTool')}
                                secondary={t('helpDialog.shapeToolDesc')}
                            />
                        </ListItem>
                    </List>
                </Box>

                <Divider sx={{ mb: 2 }} />

                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>{t('helpDialog.stationDetails')}</Typography>
                    <List dense>
                        <ListItem>
                            <ListItemText
                                primary={t('helpDialog.fareZones')}
                                secondary={t('helpDialog.fareZonesDesc')}
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemText
                                primary={t('helpDialog.serviceIcons')}
                                secondary={t('helpDialog.serviceIconsDesc')}
                            />
                        </ListItem>
                    </List>
                </Box>

                <Divider sx={{ mb: 2 }} />

                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>{t('helpDialog.creatingLines')}</Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        {t('helpDialog.creatingLinesBody')}
                    </Typography>
                    <List dense>
                        <ListItem>
                            <ListItemText primary={t('helpDialog.creatingLineStep1')} />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary={t('helpDialog.creatingLineStep2')} />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary={t('helpDialog.creatingLineStep3')} />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary={t('helpDialog.creatingLineStep4')} />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary={t('helpDialog.creatingLineStep5')} />
                        </ListItem>
                    </List>
                </Box>

                <Divider sx={{ mb: 2 }} />

                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>{t('helpDialog.keyboardShortcuts')}</Typography>
                    <List dense>
                        <ListItem>
                            <ListItemText primary="Ctrl+Z / Cmd+Z" secondary={t('helpDialog.undoShortcut')} />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="Ctrl+Y / Cmd+Shift+Z" secondary={t('helpDialog.redoShortcut')} />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="Delete / Backspace" secondary={t('helpDialog.deleteShortcut')} />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="Escape" secondary={t('helpDialog.escapeShortcut')} />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="Space (hold) + drag" secondary={t('helpDialog.panShortcut')} />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="Shift + click" secondary={t('helpDialog.multiSelectShortcut')} />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="Backspace / Delete (during shape drawing)" secondary={t('helpDialog.removeShapePointShortcut')} />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="Double-click" secondary={t('helpDialog.doubleClickShortcut')} />
                        </ListItem>
                    </List>
                </Box>

                <Divider sx={{ mb: 2 }} />

                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>{t('helpDialog.viewControls')}</Typography>
                    <List dense>
                        <ListItem>
                            <ListItemText primary={t('helpDialog.zoomInControl')} secondary={t('helpDialog.zoomInControlDesc')} />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary={t('helpDialog.zoomOutControl')} secondary={t('helpDialog.zoomOutControlDesc')} />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary={t('helpDialog.resetViewControl')} secondary={t('helpDialog.resetViewControlDesc')} />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary={t('helpDialog.panControl')} secondary={t('helpDialog.panControlDesc')} />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary={t('helpDialog.themeToggleControl')} secondary={t('helpDialog.themeToggleControlDesc')} />
                        </ListItem>
                    </List>
                </Box>

                <Divider sx={{ mb: 2 }} />

                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>{t('helpDialog.export')}</Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        {t('helpDialog.exportBody')}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        {t('helpDialog.importExportJSONBody')}
                    </Typography>
                </Box>

                <Divider sx={{ mb: 2 }} />

                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>{t('helpDialog.backgroundImage')}</Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        {t('helpDialog.backgroundImageBody')}
                    </Typography>
                </Box>

                <Divider sx={{ mb: 2 }} />

                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>{t('helpDialog.autoSave')}</Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        {t('helpDialog.autoSaveBody')}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        {t('helpDialog.autoSaveNote')}
                    </Typography>
                </Box>

                <Divider sx={{ mb: 2 }} />

                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>{t('helpDialog.gridSize')}</Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        {t('helpDialog.gridSizeBody')}
                    </Typography>
                </Box>

                <Divider sx={{ mb: 2 }} />

                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>{t('helpDialog.lineWidth')}</Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        {t('helpDialog.lineWidthBody')}
                    </Typography>
                </Box>

                <Divider sx={{ mb: 2 }} />

                <Box>
                    <Typography variant="h6" gutterBottom>{t('helpDialog.tips')}</Typography>
                    <List dense>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                            <ListItem key={n}>
                                <ListItemText primary={t(`helpDialog.tip${n}`)} />
                            </ListItem>
                        ))}
                    </List>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>{t('common.close')}</Button>
            </DialogActions>
        </Dialog>
    )
}
